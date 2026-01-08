"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { hash } from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/* -------------------------------------------------------------------------- */
/*                            ORGANIZATION ACTIONS                            */
/* -------------------------------------------------------------------------- */

export async function createOrganization(name: string, type: "MASTER_CLIENT" | "SUB_CLIENT" = "SUB_CLIENT") {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const newOrg = await prisma.organization.create({
            data: {
                name,
                type,
                ownerId: session.user.id, // Current user is the owner
                status: "ACTIVE",
                users: {
                    connect: { id: session.user.id } // Automatically add owner as member
                }
            },
        });

        // Also explicitly update the user's current organizationId context to this one
        await prisma.user.update({
            where: { id: session.user.id },
            data: { organizationId: newOrg.id }
        });

        revalidatePath("/dashboard/organizations");
        return { success: true, organization: newOrg };
    } catch (error) {
        console.error("CREATE ORG ERROR:", error);
        return { success: false, error: "Failed to create organization" };
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

    const orgs = await prisma.organization.findMany({
        where: {
            ownerId: session.user.id,
        },
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
