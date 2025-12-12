"use client";

import { Copy } from "lucide-react";

export function BookkeepingInfo() {
    const infoItems = [
        { label: "Document Inbox", value: "rbtesthamzabro@app.entrybot.com", copyable: true },
        { label: "Base Currency", value: "GBP", copyable: false },
        { label: "Accounting Software", value: "Other (Excel Output)", copyable: false },
        { label: "VAT/GST Status", value: "Registered", copyable: false },
        { label: "VAT/GST Number", value: "12345678", copyable: false },
        { label: "Annual Accounts", value: "To be completed", status: "pending" },
        { label: "VAT Filing", value: "To be completed", status: "pending" },
        { label: "Confirmation Statement", value: "To be completed", status: "pending" },
        { label: "Corporation Tax", value: "To be completed", status: "pending" },
    ];

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-full flex flex-col">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Key Bookkeeping Information</h3>
            <p className="text-xs text-slate-500 mb-6">You can see all bookkeeping information updates here.</p>

            <div className="space-y-0 divide-y divide-slate-100 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {infoItems.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-3.5 group">
                        <span className="text-sm font-medium text-slate-500">{item.label}</span>
                        <div className="flex items-center gap-2">
                            <span className={`text-sm font-semibold ${item.status === 'pending' ? 'text-amber-500 italic' : 'text-slate-800'}`}>
                                {item.value}
                            </span>
                            {item.copyable && (
                                <button className="text-slate-300 hover:text-indigo-600 transition-colors opacity-0 group-hover:opacity-100" title="Copy">
                                    <Copy className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 text-center">
                <button className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">View All Details</button>
            </div>
        </div>
    );
}
