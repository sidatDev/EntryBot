"use server";

import { prisma } from "@/lib/prisma";

export type Permission = string;

export interface UserPermissions {
    role: string;
    customRoleId?: string | null;
    customRoleName?: string | null;
    permissions: Permission[];
}

// Admin has all permissions
const ADMIN_PERMISSIONS = "*";

// Default permissions for CLIENT role (SUBMITTER in DB)
const CLIENT_PERMISSIONS: Permission[] = [
    "dashboard.view",
    "invoices.view",
    "invoices.upload",
    "bank.view",
    "bank.upload",
    "other.view",
    "other.upload",
    "history.view",
    "recycle.view",
];

// Re-use Client permissions for Employees for now
const EMPLOYEE_PERMISSIONS: Permission[] = [...CLIENT_PERMISSIONS];

/**
 * Get user permissions (SERVER ACTION)
 */
export async function getUserPermissionsAction(userId: string): Promise<UserPermissions> {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                customRole: {
                    select: {
                        id: true,
                        name: true,
                        permissions: true
                    }
                }
            }
        });

        if (!user) {
            return {
                role: "SUBMITTER",
                permissions: []
            };
        }

        // Admin gets all permissions
        if (user.role === "ADMIN") {
            return {
                role: "ADMIN",
                permissions: [ADMIN_PERMISSIONS]
            };
        }

        // Custom role
        if (user.customRole) {
            try {
                const permissions = JSON.parse(user.customRole.permissions);
                return {
                    role: user.role,
                    customRoleId: user.customRole.id,
                    customRoleName: user.customRole.name,
                    permissions: Array.isArray(permissions) ? permissions : []
                };
            } catch (e) {
                console.error("Failed to parse custom role permissions", e);
            }
        }

        // Default CLIENT permissions
        if (user.role === "EMPLOYEE") {
            return {
                role: "EMPLOYEE",
                permissions: EMPLOYEE_PERMISSIONS
            };
        }

        return {
            role: user.role,
            permissions: CLIENT_PERMISSIONS
        };
    } catch (error) {
        console.error("Error fetching user permissions:", error);
        return {
            role: "SUBMITTER",
            permissions: CLIENT_PERMISSIONS
        };
        return {
            role: "SUBMITTER",
            permissions: CLIENT_PERMISSIONS
        };
    }
}

/**
 * Determine the best redirect path for a user after login
 */
export async function getInitialRedirectPath(userId: string): Promise<string> {
    const userPerms = await getUserPermissionsAction(userId);
    const { permissions, role } = userPerms;
    const ADMIN_PERMISSIONS = "*";

    // 1. Admin always goes to dashboard (or hub if enabled, but dashboard is safe)
    if (role === "ADMIN" || permissions.includes(ADMIN_PERMISSIONS)) {
        return "/dashboard";
    }

    // 2. Check permissions in priority order
    if (permissions.includes("dashboard.view")) return "/dashboard";
    if (permissions.includes("invoices.view")) return "/documents?status=UPLOADED"; // or just /documents
    if (permissions.includes("bank.view")) return "/bank-statements";
    if (permissions.includes("id_cards.view")) return "/id-cards";
    if (permissions.includes("other.view")) return "/other-documents";
    if (permissions.includes("history.view")) return "/history";

    // 3. Fallback
    return "/dashboard";
}
