"use client";

import { Bell, HelpCircle, Settings, User } from "lucide-react";

export function TopHeader() {
    return (
        <header className="flex items-center justify-between px-8 py-4 bg-white border-b border-slate-200">
            <div>
                <h2 className="text-xl font-semibold text-slate-800">Welcome <span className="text-indigo-600">Hamza Sheikh.</span></h2>
                <p className="text-sm text-slate-500">Here's what's happening with your account today.</p>
            </div>
            <div className="flex items-center gap-4">
                <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-full transition-colors relative">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border-2 border-white"></span>
                </button>
                <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-full transition-colors">
                    <HelpCircle className="h-5 w-5" />
                </button>
                <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-full transition-colors">
                    <Settings className="h-5 w-5" />
                </button>
                <div className="pl-4 border-l border-slate-200 flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium text-slate-700">Hamza Sheikh</p>
                        <p className="text-xs text-slate-400">Admin</p>
                    </div>
                    <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 border border-slate-200">
                        <User className="h-5 w-5" />
                    </div>
                </div>
            </div>
        </header>
    );
}
