"use client";


import { Bell, Search } from "lucide-react";
import NotificationBell from "@/components/layout/NotificationBell";

import { MobileSidebar } from "@/components/layout/MobileSidebar";
import { OrganizationSwitcher } from "./OrganizationSwitcher";
import { useSearchParams } from "next/navigation";

interface TopHeaderProps {
    userRole?: string;
    ownedOrgs?: any[]; // For Master Client
}

export function TopHeader({ userRole, ownedOrgs = [] }: TopHeaderProps) {
    const searchParams = useSearchParams();
    const currentOrgId = searchParams.get("orgId") || ownedOrgs?.[0]?.id; // Default to first if not set

    return (
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-10">
            <div className="flex items-center gap-4">
                <MobileSidebar />

                {/* Global Organization Switcher for Clients with Multiple Orgs */}
                {ownedOrgs.length > 0 && (
                    <div className="hidden md:block mr-4">
                        <OrganizationSwitcher availableOrgs={ownedOrgs} currentOrgId={currentOrgId} />
                    </div>
                )}

                <div className="relative hidden md:block w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search documents..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
            </div>

            <div className="flex items-center gap-2">
                <NotificationBell />
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm">
                    {/* User Initials */}
                    JD
                </div>
            </div>
        </header>
    );
}
