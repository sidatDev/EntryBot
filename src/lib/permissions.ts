// Permission utilities for RBAC

export type Permission = string; // Format: "module.action" e.g., "invoices.view", "users.create_edit"

export interface UserPermissions {
    role: string;
    customRoleId?: string | null;
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

/**
 * Check if user has a specific permission
 */
export function hasPermission(userPermissions: UserPermissions, permission: Permission): boolean {
    // Admin has all permissions
    if (userPermissions.role === "ADMIN") {
        return true;
    }

    // Check if permission exists in user's permission list
    return userPermissions.permissions.includes(permission);
}

/**
 * Get user permissions based on role and custom role
 */
export async function getUserPermissions(userId: string): Promise<UserPermissions> {
    const { prisma } = await import("@/lib/prisma");

    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            customRole: {
                select: {
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
                customRoleId: user.customRoleId,
                permissions: Array.isArray(permissions) ? permissions : []
            };
        } catch (e) {
            console.error("Failed to parse custom role permissions", e);
        }
    }

    // Default CLIENT permissions
    return {
        role: user.role,
        permissions: CLIENT_PERMISSIONS
    };
}

/**
 * Filter navigation items based on user permissions
 */
export function filterNavByPermissions(permissions: UserPermissions) {
    // If admin, show everything
    if (permissions.role === "ADMIN") {
        return {
            showDashboard: true,
            showInvoices: true,
            showBankStatements: true,
            showOtherDocuments: true,
            showHistory: true,
            showRecycleBin: true,
            showIntegration: true,
            showUsers: true,
            showRoles: true
        };
    }

    return {
        showDashboard: hasPermission(permissions, "dashboard.view"),
        showInvoices: hasPermission(permissions, "invoices.view"),
        showBankStatements: hasPermission(permissions, "bank.view"),
        showOtherDocuments: hasPermission(permissions, "other.view"),
        showHistory: hasPermission(permissions, "history.view"),
        showRecycleBin: hasPermission(permissions, "recycle.view"),
        showIntegration: hasPermission(permissions, "integration.view") || hasPermission(permissions, "integration.edit"),
        showUsers: hasPermission(permissions, "users.view") || hasPermission(permissions, "users.create_edit"),
        showRoles: hasPermission(permissions, "roles.view") || hasPermission(permissions, "roles.create_edit")
    };
}
