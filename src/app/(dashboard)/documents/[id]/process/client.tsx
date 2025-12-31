"use client";

import { DocumentViewer } from "@/components/document/DocumentViewer";
import { InvoiceForm } from "@/components/forms/InvoiceForm";
import { BankStatementForm } from "@/components/forms/BankStatementForm";
import { IdentityCardForm } from "@/components/forms/IdentityCardForm";
import { updateDocumentStatus } from "@/lib/actions";
import { CheckCircle, FileText, Landmark, User, CreditCard } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

export function ProcessPageClient({ document, initialInvoices }: { document: any, initialInvoices: any[] }) {
    const isStatement = document.category === "STATEMENT";
    const isIdCard = document.category === "IDENTITY_CARD" || document.category === "ID_CARD"; // Handle legacy if any

    // Determine default mode
    let defaultMode: "INVOICE" | "BANK_STATEMENT" | "IDENTITY_CARD" = "INVOICE";
    if (isStatement) defaultMode = "BANK_STATEMENT";
    if (isIdCard) defaultMode = "IDENTITY_CARD";

    const [mode, setMode] = useState<"INVOICE" | "BANK_STATEMENT" | "IDENTITY_CARD">(defaultMode);

    return (
        <div className="fixed inset-0 top-0 left-64 z-0 flex flex-col h-screen bg-slate-50">
            {/* Header with document info and actions */}
            <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-sm z-10">
                <div className="flex items-center gap-4">
                    <Link
                        href="/documents"
                        className="text-sm text-slate-600 hover:text-indigo-600 transition-colors"
                    >
                        ← Back
                    </Link>
                    <div className="h-4 w-px bg-slate-300" />
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="font-semibold text-slate-800 truncate max-w-[300px]" title={document.name}>{document.name}</h2>
                            <Badge variant="outline" className="text-[10px] h-5 font-normal text-slate-500">{document.type}</Badge>
                        </div>
                    </div>
                </div>

                {/* Mode Switcher */}
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button
                        onClick={() => setMode("INVOICE")}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${mode === "INVOICE" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                    >
                        <FileText className="h-3.5 w-3.5" />
                        Invoice
                    </button>
                    <button
                        onClick={() => setMode("BANK_STATEMENT")}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${mode === "BANK_STATEMENT" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                    >
                        <Landmark className="h-3.5 w-3.5" />
                        Bank
                    </button>
                    <button
                        onClick={() => setMode("IDENTITY_CARD")}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${mode === "IDENTITY_CARD" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                    >
                        <CreditCard className="h-3.5 w-3.5" />
                        ID Card
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    {document.status !== "COMPLETED" && (
                        <button
                            onClick={async () => await updateDocumentStatus(document.id, "COMPLETED")}
                            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium shadow-md shadow-emerald-100"
                        >
                            <CheckCircle className="h-4 w-4" />
                            Mark Complete
                        </button>
                    )}
                    {document.status === "COMPLETED" && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium border border-emerald-100">
                            <CheckCircle className="h-4 w-4" />
                            Completed
                        </div>
                    )}
                </div>
            </div>

            {/* Created Invoices List (if any) */}
            {initialInvoices.length > 0 && mode === "INVOICE" && (
                <div className="bg-indigo-50 border-b border-indigo-100 px-6 py-2">
                    <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">Linked Invoices:</span>
                        {initialInvoices.map((invoice) => (
                            <div
                                key={invoice.id}
                                className="flex items-center gap-2 px-2 py-1 bg-white rounded border border-indigo-200 text-xs"
                            >
                                <span className="font-medium text-slate-700">{invoice.invoiceNumber}</span>
                                <span className="text-slate-400">•</span>
                                <span className="text-slate-600">${invoice.totalAmount?.toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Split View */}
            <div className="flex-1 flex overflow-hidden">
                <div className="w-1/2 h-full bg-slate-100 overflow-hidden border-r border-slate-200 relative">
                    {/* Document Viewer */}
                    <DocumentViewer
                        url={document.url}
                        type={document.type}
                        secondUrl={mode === "IDENTITY_CARD" ? document.identityCard?.cardBackUrl : undefined}
                    />
                </div>
                <div className="w-1/2 h-full bg-white overflow-hidden">
                    {mode === "INVOICE" && (
                        <InvoiceForm documentId={document.id} documentUrl={document.url} />
                    )}
                    {mode === "BANK_STATEMENT" && (
                        <BankStatementForm documentId={document.id} documentUrl={document.url} />
                    )}
                    {mode === "IDENTITY_CARD" && (
                        <IdentityCardForm documentId={document.id} documentUrl={document.url} />
                    )}
                </div>
            </div>
        </div>
    );
}
