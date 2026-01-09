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
    "hub.view", // Replaced dashboard.view with explicit hub view for clients
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

// Restricted permissions for Data Entry Operator
const ENTRY_OPERATOR_PERMISSIONS: Permission[] = [
    "dashboard.view", // Can see dashboard (Operator View)
    "doc.process",    // Can process documents
    "invoices.view",  // Can view invoice list (filtered to pool+queue)
    "bank.view",      // Can view bank statement list (filtered to pool+queue)
    "other.view",     // Can view other documents (filtered to pool+queue)
    // NO upload, NO history, NO recycle bin, NO hub
];


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

        if (user.role === "ENTRY_OPERATOR") {
            return {
                role: "ENTRY_OPERATOR",
                permissions: ENTRY_OPERATOR_PERMISSIONS
            };
        }

        if (user.role === "MANAGER") {
            return {
                role: "MANAGER",
                permissions: ["team.view"]
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
    if (permissions.includes("team.view")) return "/team";
    if (permissions.includes("invoices.view")) return "/documents?status=UPLOADED"; // or just /documents
    if (permissions.includes("bank.view")) return "/bank-statements";
    if (permissions.includes("id_cards.view")) return "/id-cards";
    if (permissions.includes("other.view")) return "/other-documents";
    if (permissions.includes("history.view")) return "/history";

    // 3. Fallback
    return "/dashboard";
}
