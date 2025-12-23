"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, Settings, LogOut, User, ShoppingCart, TrendingUp, History, Trash2, CreditCard, Files, Users, BookOpen, Percent, Shield, ChevronDown, Building } from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { getUserPermissionsAction, type UserPermissions } from "@/lib/permissions-actions";

// Client-side utility functions
function hasPermission(userPermissions: UserPermissions, permission: string): boolean {
    const ADMIN_PERMISSIONS = "*";
    // Admin has all permissions
    if (userPermissions.permissions.includes(ADMIN_PERMISSIONS)) {
        return true;
    }
    // Check if permission exists in user's permission list
    return userPermissions.permissions.includes(permission);
}

// Client-side utility to get nav visibility from permissions
function getNavVisibility(permissions: UserPermissions) {
    const ADMIN_PERMISSIONS = "*";

    // If admin, show everything
    if (permissions.permissions.includes(ADMIN_PERMISSIONS)) {
        return {
            showDashboard: true,
            showInvoices: true,
            showBankStatements: true,
            showOtherDocuments: true,
            showHistory: true,
            showRecycleBin: true,
            showIntegration: true,
            showUsers: true,
            showRoles: true,
            showOrganizations: true
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
        showRoles: hasPermission(permissions, "roles.view") || hasPermission(permissions, "roles.create_edit"),
        showOrganizations: hasPermission(permissions, "org.manage") || hasPermission(permissions, "org.view")
    };
}


const mainNavItems = [
    {
        title: "The Hub",
        href: "/hub",
        icon: LayoutDashboard, // Or another icon resembling a command center
        permissionKey: "showDashboard" // Everyone with dashboard access sees the hub? Or specific permission.
    },
    {
        title: "Dashboard",
        href: "/dashboard",
        icon: TrendingUp, // Identifying generic dashboard with graph icon
        permissionKey: "showDashboard"
    },
    {
        title: "Invoices & Receipts",
        icon: FileText,
        permissionKey: "showInvoices",
        hasDropdown: true,
        subItems: [
            {
                title: "All Invoices",
                href: "/documents?status=UPLOADED",
                permissionKey: "showInvoices"
            },
            {
                title: "Sales Invoices",
                href: "/documents?category=SALES_INVOICE",
                permissionKey: "showInvoices"
            },
            {
                title: "Purchase Invoices",
                href: "/documents?category=PURCHASE_INVOICE",
                permissionKey: "showInvoices"
            }
        ]
    },
    {
        title: "Bank & Card Statements",
        href: "/bank-statements",
        icon: CreditCard,
        permissionKey: "showBankStatements"
    },
    {
        title: "Other Documents",
        href: "/other-documents",
        icon: Files,
        permissionKey: "showOtherDocuments"
    },
    {
        title: "Upload History",
        href: "/history",
        icon: History,
        permissionKey: "showHistory"
    },
    {
        title: "Recycle Bin",
        href: "/recycle-bin",
        icon: Trash2,
        permissionKey: "showRecycleBin"
    },
    {
        title: "Integration Data",
        href: "/integration-data",
        icon: Settings,
        permissionKey: "showIntegration"
    },
    {
        title: "User Management",
        href: "/users",
        icon: Users,
        permissionKey: "showUsers"
    },
    {
        title: "Organizations",
        href: "/super-admin/organizations",
        icon: Building,
        permissionKey: "showOrganizations"
    },
    {
        title: "Packages",
        href: "/super-admin/packages",
        icon: CreditCard,
        permissionKey: "showOrganizations" // Reuse admin permission for now
    },
    {
        title: "Role Management",
        href: "/roles",
        icon: Shield,
        permissionKey: "showRoles"
    },
];

export function Sidebar({ mobile = false }: { mobile?: boolean }) {
    const pathname = usePathname();
    const { data: session } = useSession();
    const [navVisibility, setNavVisibility] = useState({
        showDashboard: true,
        showInvoices: true,
        showBankStatements: true,
        showOtherDocuments: true,
        showHistory: true,
        showRecycleBin: true,
        showIntegration: true,
        showUsers: false,
        showRoles: false,
        showOrganizations: false,
    });
    const [expandedItems, setExpandedItems] = useState<string[]>(["Invoices & Receipts"]); // Default expanded

    // Fetch permissions on mount and when session changes
    useEffect(() => {
        async function fetchPermissions() {
            if (session?.user?.id) {
                try {
                    const permissions = await getUserPermissionsAction(session.user.id);
                    const visibility = getNavVisibility(permissions);
                    setNavVisibility(visibility);
                } catch (error) {
                    console.error("Failed to fetch permissions:", error);
                }
            }
        }
        fetchPermissions();
    }, [session?.user?.id]);

    const baseClasses = "bg-[#1e293b] text-white flex flex-col h-full overflow-hidden";
    const desktopClasses = "w-64 fixed left-0 top-0 z-40 h-screen hidden lg:flex";
    const mobileClasses = "w-full h-full flex";

    // Filter navigation items based on permissions
    const visibleNavItems = mainNavItems.filter(item => {
        return navVisibility[item.permissionKey as keyof typeof navVisibility];
    });

    return (
        <aside className={cn(baseClasses, mobile ? mobileClasses : desktopClasses)}>
            {/* Branding */}
            <div className="p-6 border-b border-slate-700">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-green-500 rounded-lg flex items-center justify-center shadow-lg">
                        <div className="text-black font-bold text-xl">eb</div>
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-white leading-tight">EntryBot</h1>
                        <p className="text-xs text-slate-400">Automated Accounting</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
                <nav className="space-y-1 px-3">
                    {visibleNavItems.map((item) => {
                        const Icon = item.icon;

                        // Handle dropdown items
                        if (item.hasDropdown && item.subItems) {
                            const isExpanded = expandedItems.includes(item.title);
                            const isAnySubItemActive = item.subItems.some(subItem =>
                                pathname.includes(subItem.href)
                            );

                            return (
                                <div key={item.title}>
                                    <button
                                        onClick={() => {
                                            setExpandedItems(prev =>
                                                prev.includes(item.title)
                                                    ? prev.filter(t => t !== item.title)
                                                    : [...prev, item.title]
                                            );
                                        }}
                                        className={cn(
                                            "w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium transition-all duration-200 border-l-4",
                                            isAnySubItemActive
                                                ? "bg-slate-800 text-white border-blue-500"
                                                : "text-slate-400 hover:bg-slate-800 hover:text-white border-transparent"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Icon className={cn("h-5 w-5", isAnySubItemActive ? "text-blue-500" : "text-slate-400")} />
                                            {item.title}
                                        </div>
                                        <ChevronDown className={cn(
                                            "h-4 w-4 transition-transform",
                                            isExpanded ? "rotate-180" : ""
                                        )} />
                                    </button>

                                    {isExpanded && (
                                        <div className="ml-4 mt-1 space-y-1">
                                            {item.subItems.map((subItem) => {
                                                const isSubActive = pathname.includes(subItem.href);
                                                return (
                                                    <Link
                                                        key={subItem.title}
                                                        href={subItem.href}
                                                        className={cn(
                                                            "flex items-center gap-3 px-3 py-2 text-sm font-medium transition-all duration-200 rounded-md",
                                                            isSubActive
                                                                ? "bg-slate-700 text-white"
                                                                : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                                        )}
                                                    >
                                                        <div className="h-1.5 w-1.5 rounded-full bg-current" />
                                                        {subItem.title}
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        }

                        // Regular items
                        const isActive = item.href === "/dashboard"
                            ? pathname === "/dashboard"
                            : pathname === item.href;

                        return (
                            <Link
                                key={item.title}
                                href={item.href!}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-200 border-l-4",
                                    isActive
                                        ? "bg-slate-800 text-white border-blue-500"
                                        : "text-slate-400 hover:bg-slate-800 hover:text-white border-transparent"
                                )}
                            >
                                <Icon className={cn("h-5 w-5", isActive ? "text-blue-500" : "text-slate-400")} />
                                {item.title}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* User Profile Footer */}
            <div className="p-4 border-t border-slate-700 bg-slate-800/50">
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                        {session?.user?.name?.[0] || "U"}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                            {session?.user?.name || "User"}
                        </p>
                        <p className="text-xs text-slate-400 truncate">
                            {session?.user?.email || "user@example.com"}
                        </p>
                    </div>
                    <button
                        onClick={() => signOut()}
                        className="text-slate-400 hover:text-red-400 transition-colors"
                        title="Sign out"
                    >
                        <LogOut className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </aside>
    );
}
