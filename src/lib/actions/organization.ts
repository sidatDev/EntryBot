"use server"

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { hash } from "bcryptjs";

export type CreateOrgData = {
    name: string;
    type: "MASTER_CLIENT" | "CHILD_CLIENT";
    parentId?: string;
    adminName: string;
    adminEmail: string;
    adminPassword?: string;
};

export async function createOrganization(data: CreateOrgData) {
    try {
        // 1. Validate Hierarchy
        if (data.type === "CHILD_CLIENT" && !data.parentId) {
            return { error: "Child Client must have a Master Client (parentId)" };
        }

        // 2. Create Organization
        const org = await prisma.organization.create({
            data: {
                name: data.name,
                type: data.type,
                parentId: data.parentId,
                status: "ACTIVE",
                credits: 50, // Default trial credits
            },
        });

        // 3. Create Admin User for this Org
        const hashedPassword = await hash(data.adminPassword || "welcome123", 10);

        // Determine Role Name based on Org Type
        const roleName = data.type === "MASTER_CLIENT" ? "MASTER_ADMIN" : "MANAGER"; // Default for child?

        const role = await prisma.role.findUnique({ where: { name: roleName } });

        const user = await prisma.user.create({
            data: {
                name: data.adminName,
                email: data.adminEmail,
                passwordHash: hashedPassword,
                organizationId: org.id,
                customRoleId: role?.id,
                role: "ADMIN", // Fallback
            },
        });

        revalidatePath("/super-admin/organizations");
        return { success: true, org, user };

    } catch (error: any) {
        console.error("Error creating organization:", error);
        return { error: error.message };
    }
}

export async function getOrganizations(type?: string) {
    try {
        const where = type ? { type } : {};
        const orgs = await prisma.organization.findMany({
            where,
            include: {
                parent: { select: { name: true } },
                _count: { select: { children: true, users: true } }
            },
            orderBy: { createdAt: "desc" }
        });
        return { success: true, data: orgs };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function getChildOrganizations(parentId: string) {
    try {
        const orgs = await prisma.organization.findMany({
            where: { parentId },
            include: {
                _count: { select: { users: true, documents: true } }
            },
            orderBy: { createdAt: "desc" }
        });
        return { success: true, data: orgs };
    } catch (error: any) {
        return { error: error.message };
    }
}
