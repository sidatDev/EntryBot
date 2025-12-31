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
        <div className="fixed inset-0 top-0 left-0 lg:left-64 z-0 flex flex-col h-screen bg-slate-50">
            {/* Header with document info and actions */}
            <div className="bg-white border-b border-slate-200 px-4 lg:px-6 py-3 flex flex-col lg:flex-row lg:items-center justify-between shadow-sm z-10 gap-4 lg:gap-0">
                <div className="flex items-center justify-between lg:justify-start gap-4 w-full lg:w-auto">
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
                                <h2 className="font-semibold text-slate-800 truncate max-w-[200px] lg:max-w-[300px]" title={document.name}>{document.name}</h2>
                                <Badge variant="outline" className="text-[10px] h-5 font-normal text-slate-500 hidden sm:inline-flex">{document.type}</Badge>
                            </div>
                        </div>
                    </div>
                    {/* Mobile Only: Status Badge */}
                    <div className="lg:hidden">
                        {document.status === "COMPLETED" && (
                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100">Completed</Badge>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-between gap-3 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0">
                    {/* Mode Switcher */}
                    <div className="flex bg-slate-100 p-1 rounded-lg shrink-0">
                        <button
                            onClick={() => setMode("INVOICE")}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${mode === "INVOICE" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                        >
                            <FileText className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Invoice</span>
                            <span className="sm:hidden">Inv</span>
                        </button>
                        <button
                            onClick={() => setMode("BANK_STATEMENT")}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${mode === "BANK_STATEMENT" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                        >
                            <Landmark className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Bank</span>
                            <span className="sm:hidden">Bank</span>
                        </button>
                        <button
                            onClick={() => setMode("IDENTITY_CARD")}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${mode === "IDENTITY_CARD" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                        >
                            <CreditCard className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">ID Card</span>
                            <span className="sm:hidden">ID</span>
                        </button>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                        {document.status !== "COMPLETED" && (
                            <button
                                onClick={async () => await updateDocumentStatus(document.id, "COMPLETED")}
                                className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium shadow-md shadow-emerald-100 whitespace-nowrap"
                            >
                                <CheckCircle className="h-4 w-4" />
                                <span className="hidden sm:inline">Mark Complete</span>
                                <span className="sm:hidden">Complete</span>
                            </button>
                        )}
                        {document.status === "COMPLETED" && (
                            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium border border-emerald-100">
                                <CheckCircle className="h-4 w-4" />
                                Completed
                            </div>
                        )}
                    </div>
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
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                <div className="w-full lg:w-1/2 h-[40vh] lg:h-full bg-slate-100 overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-200 relative">
                    {/* Document Viewer */}
                    <DocumentViewer
                        url={document.url}
                        type={document.type}
                        secondUrl={mode === "IDENTITY_CARD" ? document.identityCard?.cardBackUrl : undefined}
                    />
                </div>
                <div className="w-full lg:w-1/2 flex-1 lg:h-full bg-white overflow-hidden">
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
