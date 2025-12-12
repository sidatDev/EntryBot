"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface IntegrationTabsProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
}

const tabs = [
    { id: "integration", label: "Accounting Software Integration" },
    { id: "contacts", label: "Contacts" },
    { id: "chart-of-accounts", label: "Chart of Accounts" },
    { id: "payment-methods", label: "Payment Methods" },
    { id: "tax-rates", label: "VAT/GST Rates" },
];

export function IntegrationTabs({ activeTab, onTabChange }: IntegrationTabsProps) {
    return (
        <div className="border-b border-slate-200">
            <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={cn(
                            "whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors",
                            activeTab === tab.id
                                ? "border-blue-500 text-blue-600"
                                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </nav>
        </div>
    );
}
