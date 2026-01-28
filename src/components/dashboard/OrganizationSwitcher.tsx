"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ChevronsUpDown, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Org {
    id: string;
    name: string;
    type: string;
}

interface OrganizationSwitcherProps {
    availableOrgs: Org[];
    currentOrgId?: string;
}

export function OrganizationSwitcher({ availableOrgs, currentOrgId }: OrganizationSwitcherProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isOpen, setIsOpen] = useState(false);

    // Find current org name based on ID
    const currentOrg = availableOrgs.find(o => o.id === currentOrgId);

    const handleSelect = (orgId: string) => {
        setIsOpen(false);
        // Switch Logic:
        // We want to verify if the user wants to stay on the same page or go to dashboard.
        // Assuming we want to update the view "in-place" if possible, or reset to Dashboard.
        // The safest bet for a global context switch is to go to `/dashboard?orgId=...` 
        // unless the current route supports the param.

        const params = new URLSearchParams(searchParams);
        params.set("orgId", orgId);

        // If we are on a page that supports org switching, just replace params
        router.push(`${pathname}?${params.toString()}`);
        router.refresh(); // Ensure server components re-fetch
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors min-w-[200px] justify-between"
            >
                <div className="flex items-center gap-2 truncate">
                    <Building2 className="h-4 w-4 text-slate-500" />
                    <span className="truncate">{currentOrg ? currentOrg.name : "Select Organization"}</span>
                </div>
                <ChevronsUpDown className="h-4 w-4 text-slate-400" />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50 max-h-[300px] overflow-y-auto">
                    {availableOrgs.map((org) => (
                        <button
                            key={org.id}
                            onClick={() => handleSelect(org.id)}
                            className={cn(
                                "w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-2",
                                currentOrgId === org.id ? "text-indigo-600 bg-indigo-50" : "text-slate-700"
                            )}
                        >
                            <span className="truncate flex-1">{org.name}</span>
                        </button>
                    ))}
                    {availableOrgs.length === 0 && (
                        <div className="px-4 py-2 text-sm text-slate-400">No organizations found</div>
                    )}
                </div>
            )}

            {/* Backdrop to close */}
            {isOpen && (
                <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            )}
        </div>
    );
}
