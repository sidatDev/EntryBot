"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, Settings, LogOut, User, ShoppingCart, TrendingUp, History, Trash2, CreditCard, Files, Users, BookOpen, Percent } from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut, useSession } from "next-auth/react";

const mainNavItems = [
    {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        title: "Invoices & Receipts",
        href: "/documents", // Active state usually implies this is the main view
        icon: FileText,
    },
    {
        title: "Bank & Card Statements",
        href: "/bank-statements",
        icon: CreditCard,
    },
    {
        title: "Other Documents",
        href: "/documents?category=OTHER",
        icon: Files,
    },
    {
        title: "Upload History",
        href: "/history",
        icon: History,
    },
    {
        title: "Recycle Bin",
        href: "/recycle-bin",
        icon: Trash2,
    },
];

const integrationItems = [
    {
        title: "Contacts",
        href: "/contacts",
        icon: Users,
    },
    {
        title: "Chart of Accounts",
        href: "/chart-of-accounts",
        icon: BookOpen,
    },
    {
        title: "Payment Methods",
        href: "/payment-methods",
        icon: CreditCard,
    },
    {
        title: "VAT/GST Rates",
        href: "/tax-rates",
        icon: Percent,
    },
];

export function Sidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();

    return (
        <aside className="w-64 bg-[#1e293b] text-white flex flex-col h-screen fixed left-0 top-0 z-40 overflow-hidden">
            {/* Branding - Matching the dark theme in the image */}
            <div className="p-6 border-b border-slate-700">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-green-500 rounded-lg flex items-center justify-center shadow-lg">
                        {/* Simple Logo Placeholder based on image */}
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
                    {mainNavItems.map((item) => {
                        const Icon = item.icon;
                        // Exact match for dashboard, partial for others to handle query params
                        const isActive = item.href === "/dashboard"
                            ? pathname === "/dashboard"
                            : pathname === item.href || (pathname.startsWith("/documents") && item.href.includes("category") && pathname.includes(item.href.split("?")[1]));

                        // Special case for "Invoices & Receipts" being active when on /documents without category
                        const isMainDocs = item.title === "Invoices & Receipts" && pathname === "/documents" && !pathname.includes("category");

                        const isSelected = isActive || isMainDocs;

                        return (
                            <Link
                                key={item.title}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-200 border-l-4",
                                    isSelected
                                        ? "bg-slate-800 text-white border-blue-500"
                                        : "text-slate-400 hover:bg-slate-800 hover:text-white border-transparent"
                                )}
                            >
                                <Icon className={cn("h-5 w-5", isSelected ? "text-blue-500" : "text-slate-400")} />
                                {item.title}
                            </Link>
                        );
                    })}
                </nav>

                <div className="mt-8 px-6 mb-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        <span className="w-2 h-2 bg-slate-600 rounded-full"></span>
                        Integration Data
                    </p>
                </div>

                <nav className="space-y-1 px-3">
                    {integrationItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.title}
                                href={item.href}
                                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-white transition-colors"
                            >
                                <div className="min-w-5">
                                    <div className="h-1.5 w-1.5 rounded-full border border-slate-500"></div>
                                </div>
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
