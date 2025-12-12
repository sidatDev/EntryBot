"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
    { label: "All", value: "ALL" }, // Or undefined/null for all
    { label: "New", value: "UPLOADED" },
    { label: "Processed", value: "PROCESSING" },
    { label: "Approved", value: "COMPLETED" },
    { label: "Reports", value: "REPORTS", href: "/reports" }, // Special case
];

export function StatusTabs() {
    const searchParams = useSearchParams();
    const currentStatus = searchParams.get("status") || "ALL";

    return (
        <div className="flex items-center space-x-1 border-b border-slate-200 mb-6 overflow-x-auto">
            {TABS.map((tab) => {
                const isActive = tab.value === "REPORTS" ? false : (currentStatus === tab.value) || (tab.value === "ALL" && !searchParams.get("status"));

                const href = tab.href || `?status=${tab.value}`;

                return (
                    <Link
                        key={tab.label}
                        href={href}
                        className={cn(
                            "px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                            isActive
                                ? "border-indigo-600 text-indigo-600"
                                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                        )}
                    >
                        {tab.label}
                    </Link>
                );
            })}
        </div>
    );
}
