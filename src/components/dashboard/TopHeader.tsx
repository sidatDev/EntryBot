"use client";

import { Bell, Search } from "lucide-react";
import NotificationBell from "@/components/layout/NotificationBell";

import { MobileSidebar } from "@/components/layout/MobileSidebar";

export function TopHeader() {
    return (
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-10">
            <div className="flex items-center gap-4">
                <MobileSidebar />
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
