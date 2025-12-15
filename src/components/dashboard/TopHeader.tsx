"use client";

import { Bell, HelpCircle, Settings, User } from "lucide-react";
import { signOut, useSession } from "next-auth/react";

import { MobileSidebar } from "@/components/layout/MobileSidebar";

export function TopHeader() {
    const { data: session } = useSession();

    return (
        <header className="flex items-center justify-between px-4 sm:px-8 py-4 bg-white border-b border-slate-200 sticky top-0 z-30">
            <div className="flex items-center gap-4">
                <MobileSidebar />
                <div>
                    <h2 className="text-lg sm:text-xl font-semibold text-slate-800">Welcome <span className="text-indigo-600">{session?.user?.name || "User"}</span></h2>
                    <p className="text-xs sm:text-sm text-slate-500 hidden sm:block">Here's what's happening with your account today.</p>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-full transition-colors relative">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border-2 border-white"></span>
                </button>
                <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-full transition-colors">
                    <Settings className="h-5 w-5" />
                </button>
                <div className="pl-4 border-l border-slate-200 flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium text-slate-700">{session?.user?.name || "User"}</p>
                        <p className="text-xs text-slate-400">{session?.user?.customRoleName || session?.user?.role || "Role"}</p>
                    </div>
                    <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 border border-slate-200">
                        <User className="h-5 w-5" />
                    </div>
                </div>
            </div>
        </header>
    );
}
