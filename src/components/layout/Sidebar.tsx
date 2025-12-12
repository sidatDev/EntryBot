"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, Settings, LogOut, User, ShoppingCart, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut, useSession } from "next-auth/react";

const navItems = [
    {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        title: "Sales Invoices",
        href: "/documents?category=SALES",
        icon: TrendingUp,
    },
    {
        title: "Purchase Invoices",
        href: "/documents?category=PURCHASE",
        icon: ShoppingCart,
    },
    {
        title: "Settings",
        href: "/settings",
        icon: Settings,
    },
];

export function Sidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();

    return (
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen fixed left-0 top-0 z-40">
            <div className="p-6 border-b border-slate-100">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-lg">E</span>
                    </div>
                    <span className="text-xl font-bold text-slate-800">EntryBot</span>
                </div>
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname.startsWith(item.href);

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                                isActive
                                    ? "bg-indigo-50 text-indigo-600 shadow-sm"
                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                            )}
                        >
                            <Icon className={cn("h-5 w-5", isActive ? "text-indigo-600" : "text-slate-400")} />
                            {item.title}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-slate-100">
                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="h-9 w-9 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-medium">
                        {session?.user?.name?.[0] || "U"}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                            {session?.user?.name || "User"}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                            {session?.user?.email || "user@example.com"}
                        </p>
                    </div>
                    <button
                        onClick={() => signOut()}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                        title="Sign out"
                    >
                        <LogOut className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </aside>
    );
}
