"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { hash } from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/* -------------------------------------------------------------------------- */
/*                            ORGANIZATION ACTIONS                            */
/* -------------------------------------------------------------------------- */

export async function createOrganization(
    dataOrName: string | {
        name: string;
        type: "MASTER_CLIENT";
        adminName: string;
        adminEmail: string;
        adminPassword: string;
    },
    type: "MASTER_CLIENT" | "SUB_CLIENT" = "SUB_CLIENT"
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return { success: false, error: "Unauthorized" };
    }

    // Handle simple signature (name, type) - Legacy/Simple
    if (typeof dataOrName === 'string') {
        const name = dataOrName;
        try {
            const newOrg = await prisma.organization.create({
                data: {
                    name,
                    type,
                    ownerId: session.user.id,  // User becomes OWNER of this org
                    status: "ACTIVE",
                },
            });

            // Note: User is now OWNER via ownerId, not a member via organizationId
            // This allows users to own multiple organizations

            revalidatePath("/dashboard/organizations");
            return { success: true, organization: newOrg };
        } catch (error) {
            console.error("CREATE ORG ERROR:", error);
            return { success: false, error: "Failed to create organization" };
        }
    }

    // Handle complex signature (Master Client Object)
    const data = dataOrName;

    // Permission check for creating Master Client (Admin only)
    if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") { // Adjust roles as needed
        return { success: false, error: "Unauthorized to create Master Clients" };
    }

    try {
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create Organization
            const newOrg = await tx.organization.create({
                data: {
                    name: data.name,
                    type: "MASTER_CLIENT",
                    ownerId: session.user.id, // Creator is owner, or new admin? Usually creator remains super-owner
                    status: "ACTIVE",
                }
            });

            // 2. Create Admin User
            const hashedPassword = await hash(data.adminPassword, 10);
            const newUser = await tx.user.create({
                data: {
                    name: data.adminName,
                    email: data.adminEmail,
                    passwordHash: hashedPassword,
                    role: "MANAGER", // Manager of this Master Client
                    organizationId: newOrg.id,
                    status: "ACTIVE",
                }
            });

            // 3. Connect User to Org
            await tx.organization.update({
                where: { id: newOrg.id },
                data: {
                    users: { connect: { id: newUser.id } },
                    // Also make the new user the 'owner' if desired, or keep super-admin as owner. 
                    // Let's keep super-admin as owner for control, but new user is the local Admin.
                }
            });

            return newOrg;
        });

        revalidatePath("/dashboard/organizations");
        return { success: true, organization: result };

    } catch (error: any) {
        console.error("CREATE MASTER ORG ERROR:", error);
        if (error.code === 'P2002') {
            return { success: false, error: "A user with this email already exists." };
        }
        return { success: false, error: "Failed to create Master Client" };
    }
}

export async function addChildClient(organizationId: string, name: string, email: string, passwordHash: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return { success: false, error: "Unauthorized" };
    }

    // Verify ownership: Does the current user own this organization?
    const org = await prisma.organization.findUnique({
        where: { id: organizationId },
    });

    if (!org || org.ownerId !== session.user.id) {
        // Allow Admins to bypass
        if (session.user.role !== "ADMIN") {
            return { success: false, error: "You do not have permission to add users to this organization" };
        }
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
        where: { email },
    });
    if (existingUser) {
        return { success: false, error: "User with this email already exists" };
    }

    try {
        const hashedPassword = await hash(passwordHash, 10);

        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                passwordHash: hashedPassword,
                role: "EMPLOYEE", // Updated from ENTRY_OPERATOR per user request
                organizationId: organizationId,
                status: "ACTIVE",
            },
        });

        return { success: true, user: newUser };
    } catch (error) {
        console.error("ADD CHILD CLIENT ERROR:", error);
        return { success: false, error: "Failed to add child client" };
    }
}

export async function getMyOrganizations() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return [];

    // Fetch user to get their organizationId
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { organizationId: true }
    });

    // Build query to get organizations where user is either owner OR member
    const whereCondition: any = {
        OR: [
            { ownerId: session.user.id }, // Organizations user owns
        ]
    };

    // If user is a member of an organization, include it
    if (user?.organizationId) {
        whereCondition.OR.push({ id: user.organizationId });
    }

    const orgs = await prisma.organization.findMany({
        where: whereCondition,
        include: {
            users: true,
            _count: {
                select: { documents: true }
            }
        }
    });

    return orgs;
}

export async function getAllOrganizations() {
    const session = await getServerSession(authOptions);
    // Allow Admins and potentially others (controlled by internal logic or UI) to see all orgs
    // For now, let's keep it simple. In a real app, strict RBAC here.
    if (!session) return { data: [] };

    // Ideally restricted to ADMIN
    if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
        return { data: [] };
    }

    const orgs = await prisma.organization.findMany({
        orderBy: { name: 'asc' }
    });
    return { data: orgs };
}

export async function getOrganizations(type?: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    try {
        const where: any = {};
        if (type) where.type = type;

        const orgs = await prisma.organization.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: {
                        children: true,
                        users: true
                    }
                }
            }
        });

        return { success: true, data: orgs };
    } catch (error) {
        console.error("GET ORGS ERROR:", error);
        return { success: false, error: "Failed to fetch organizations" };
    }
}

export async function getChildOrganizations(parentId: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    try {
        const children = await prisma.organization.findMany({
            where: { parentId },
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: {
                        documents: true
                    }
                }
            }
        });

        return { success: true, data: children };
    } catch (error) {
        console.error("GET CHILD ORGS ERROR:", error);
        return { success: false, error: "Failed to fetch child organizations" };
    }
}

export async function createChildOrganization(data: {
    name: string;
    type: "CHILD_CLIENT";
    parentId: string;
    adminName: string;
    adminEmail: string;
    adminPassword: string;
}) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    // Basic permission check (can be expanded)
    // Ensure current user owns the parent org or is ADMIN
    const parentOrg = await prisma.organization.findUnique({
        where: { id: data.parentId }
    });

    if (!parentOrg || (parentOrg.ownerId !== session.user.id && session.user.role !== "ADMIN")) {
        return { success: false, error: "You do not have permission to add sub-accounts to this organization" };
    }

    try {
        // Create Org and User in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create Child Organization
            const newOrg = await tx.organization.create({
                data: {
                    name: data.name,
                    type: data.type,
                    parentId: data.parentId,
                    ownerId: session.user.id, // Parent owner also owns the child structure generally, or handled via hierarchy
                    status: "ACTIVE",
                }
            });

            // 2. Create Admin User for this Child Org
            const hashedPassword = await hash(data.adminPassword, 10);
            const newUser = await tx.user.create({
                data: {
                    name: data.adminName,
                    email: data.adminEmail,
                    passwordHash: hashedPassword,
                    role: "MANAGER", // Manager of this child org
                    organizationId: newOrg.id,
                    status: "ACTIVE",
                }
            });

            // 3. Connect User to Org as member
            await tx.organization.update({
                where: { id: newOrg.id },
                data: {
                    users: {
                        connect: { id: newUser.id }
                    }
                }
            });

            return newOrg;
        });

        revalidatePath(`/super-admin/organizations/${data.parentId}`);
        return { success: true, organization: result };

    } catch (error: any) {
        console.error("CREATE CHILD ORG ERROR:", error);
        if (error.code === 'P2002') {
            return { success: false, error: "A user with this email already exists." };
        }
        return { success: false, error: "Failed to create sub-account" };
    }
}
