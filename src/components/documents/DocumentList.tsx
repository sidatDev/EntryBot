"use client";

import { useState } from "react";
import { FileText, Calendar, ArrowRight, CheckSquare, Square, Download, RefreshCw, Filter, Trash2, Edit, Columns, ArrowRightLeft, FilePlus, Check, X } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { PdfTools } from "@/components/tools/PdfTools";
import { useRouter } from "next/navigation";
import { updateDocumentCategory, updateInvoicePaymentMethod, softDeleteDocument, restoreDocument, permanentDeleteDocument, exportInvoicesToCSV, updateApprovalStatus, bulkApproveDocuments, assignDocumentToMe } from "@/lib/actions";
import { UploadModal } from "@/components/upload/UploadModal";
import { BulkEditModal } from "./BulkEditModal";

interface DocumentListProps {
    documents: any[];
    isRecycleBin?: boolean;
    category?: string;
}

const CATEGORY_OPTIONS = [
    { label: "Sales Invoice", value: "SALES_INVOICE" },
    { label: "Purchase Invoice", value: "PURCHASE_INVOICE" },
    { label: "Bank Statement", value: "STATEMENT" },
    { label: "Other", value: "OTHER" }
];
// const PAYMENT_METHODS = ["None", "Cash", "Bank Transfer", "Credit Card", "Debit Card", "Commonwealth Bank"]; 
const PAYMENT_METHODS = ["None", "Cash", "Bank Transfer", "Credit Card", "Debit Card", "Commonwealth Bank"];

export function DocumentList({ documents, isRecycleBin = false, category }: DocumentListProps) {
    const router = useRouter();
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [itemsPerPage, setItemsPerPage] = useState(25);
    const [notification, setNotification] = useState<{ message: string; type: "success" | "info" } | null>(null);

    const uploadCategory = category === "SALES_INVOICE"
        ? "SALES_INVOICE"
        : category === "PURCHASE_INVOICE"
            ? "PURCHASE_INVOICE"
            : category === "IDENTITY_CARD"
                ? "IDENTITY_CARD"
                : "SALES_INVOICE";

    const toggleSelection = (id: string) => {
        setSelectedIds((prev) =>
            prev.includes(id)
                ? prev.filter((i) => i !== id)
                : [...prev, id]
        );
    };

    const toggleAll = () => {
        if (selectedIds.length === documents.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(documents.map(d => d.id));
        }
    };

    const handleToolsComplete = () => {
        setSelectedIds([]);
        router.refresh();
    };

    const showNotification = (message: string, type: "success" | "info" = "info") => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleInlineCategoryChange = async (id: string, newCategory: string) => {
        // Check if item will disappear
        if (category && category !== newCategory) {
            showNotification(`Document moved to ${newCategory}. It has been removed from this list.`, "info");
        }
        await updateDocumentCategory(id, newCategory);
    };

    const handleInlinePaymentMethodChange = async (invoiceId: string, newMethod: string) => {
        if (!invoiceId) return;
        await updateInvoicePaymentMethod(invoiceId, newMethod);
        showNotification("Payment method updated", "success");
    };

    const handleDelete = async () => {
        if (!confirm(`${isRecycleBin ? "Permanently delete" : "Delete"} ${selectedIds.length} documents?`)) return;

        for (const id of selectedIds) {
            if (isRecycleBin) {
                await permanentDeleteDocument(id);
            } else {
                await softDeleteDocument(id);
            }
        }
        setSelectedIds([]);
    };

    const handleRestore = async () => {
        for (const id of selectedIds) {
            await restoreDocument(id);
        }
        setSelectedIds([]);
    };

    const handleExport = async () => {
        const csv = await exportInvoicesToCSV(selectedIds.length > 0 ? selectedIds : undefined);
        console.log("Exporting CSV...", csv);
        // In real app, trigger download blob
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoices-${Date.now()}.csv`;
        a.click();
    };

    return (
        <div className="space-y-4 relative">
            {/* Notification Toast */}
            {notification && (
                <div className={cn(
                    "fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg text-white font-medium z-50 animate-in slide-in-from-bottom-2 fade-in",
                    notification.type === "success" ? "bg-green-600" : "bg-slate-800"
                )}>
                    {notification.message}
                </div>
            )}

            {/* Action Bar - Row 1 (Top Right Actions mostly in blueprint, but we structure for layout) */}
            {!isRecycleBin && (
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-end gap-2 bg-white p-2 rounded-lg border border-slate-200">
                        <button
                            onClick={async () => {
                                if (confirm(`Approve ${selectedIds.length} documents?`)) {
                                    await bulkApproveDocuments(selectedIds);
                                    setSelectedIds([]);
                                }
                            }}
                            disabled={selectedIds.length === 0}
                            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <CheckSquare className="h-4 w-4" /> Approve
                        </button>
                        <BulkEditModal
                            selectedIds={selectedIds}
                            onComplete={handleToolsComplete}
                        />
                        {/* <button className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 text-white rounded text-sm font-medium hover:bg-blue-600">
                            <Columns className="h-4 w-4" /> Columns
                        </button>
                        <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-700 rounded text-sm font-medium hover:bg-slate-200">
                            <ArrowRightLeft className="h-4 w-4" /> Transfer
                        </button> */}
                    </div>
                </div>
            )}

            {/* Action Bar - Row 2 */}
            <div className={`flex items-center gap-2 ${isRecycleBin ? 'bg-red-500' : 'bg-blue-500'} p-2 rounded-t-lg text-white`}>
                {/* Replaced Add Files button with UploadModal trigger or integrated it */}
                <UploadModal category={uploadCategory} />
                {/* We can wrap UploadModal trigger here or custom button */}
                {!isRecycleBin && (
                    <>


                        <button
                            onClick={handleExport}
                            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 rounded text-sm font-medium hover:bg-blue-700"
                        >
                            <Download className="h-4 w-4" /> Export CSV
                        </button>
                    </>
                )}

                {isRecycleBin && (
                    <button
                        onClick={handleRestore}
                        disabled={selectedIds.length === 0}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded text-sm disabled:opacity-50"
                    >
                        <RefreshCw className="h-4 w-4" /> Restore
                    </button>
                )}

                <button
                    onClick={() => router.refresh()}
                    className={`flex items-center gap-2 px-3 py-1.5 ${isRecycleBin ? 'hover:bg-white/20' : 'hover:bg-blue-600'} rounded text-sm`}
                    title="Refresh"
                >
                    <RefreshCw className="h-4 w-4" /> Refresh
                </button>

                {!isRecycleBin && (
                    <button
                        className="flex items-center gap-2 px-3 py-1.5 hover:bg-blue-600 rounded text-sm"
                        title="Filter"
                    >
                        <Filter className="h-4 w-4" /> Filter
                    </button>
                )}

                <button
                    onClick={handleDelete}
                    disabled={selectedIds.length === 0}
                    className="flex items-center gap-2 px-3 py-1.5 hover:bg-red-700 rounded text-sm ml-auto disabled:opacity-50 disabled:hover:bg-transparent"
                >
                    <Trash2 className="h-4 w-4" /> {isRecycleBin ? "Delete Permanently" : "Delete"}
                </button>
            </div>

            <div className="bg-white rounded-b-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto min-h-[500px]">
                    <table className="w-full text-left text-sm">
                        <thead className={isRecycleBin ? "bg-red-500 text-white" : "bg-cyan-500 text-white"}>
                            <tr>
                                <th className="px-4 py-3 w-10">
                                    <button onClick={toggleAll} className="text-white hover:text-slate-100">
                                        {selectedIds.length === documents.length && documents.length > 0 ? (
                                            <CheckSquare className="h-5 w-5" />
                                        ) : (
                                            <Square className="h-5 w-5" />
                                        )}
                                    </button>
                                </th>
                                <th className="px-4 py-3 font-semibold whitespace-nowrap">Doc ID</th>
                                {category === "IDENTITY_CARD" ? (
                                    <>
                                        {/* ID Card Specific Headers */}
                                        <th className="px-4 py-3 font-semibold whitespace-nowrap">Full Name</th>
                                        <th className="px-4 py-3 font-semibold whitespace-nowrap">Identity Number</th>
                                        <th className="px-4 py-3 font-semibold whitespace-nowrap">Date of Issue</th>
                                        <th className="px-4 py-3 font-semibold whitespace-nowrap">Expiry Date</th>
                                    </>
                                ) : (
                                    <>
                                        {/* Invoice / General Headers */}
                                        <th className="px-4 py-3 font-semibold whitespace-nowrap">Doc Type</th>
                                        <th className="px-4 py-3 font-semibold whitespace-nowrap">Supplier Name</th>
                                        <th className="px-4 py-3 font-semibold whitespace-nowrap">Invoice Date</th>
                                        <th className="px-4 py-3 font-semibold text-center whitespace-nowrap">Amount <span className="text-xs opacity-75 block">(Base)</span></th>
                                    </>
                                )}

                                <th className="px-4 py-3 font-semibold text-center whitespace-nowrap">Category</th>
                                <th className="px-4 py-3 font-semibold text-center whitespace-nowrap">Approval</th>
                                <th className="px-4 py-3 font-semibold text-center whitespace-nowrap">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {documents.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="px-6 py-12 text-center text-slate-400">
                                        No documents found. Upload some to get started.
                                    </td>
                                </tr>
                            ) : (
                                documents.slice(0, itemsPerPage).map((doc) => {
                                    const isSelected = selectedIds.includes(doc.id);
                                    // Get latest invoice if available
                                    const invoice = doc.invoices?.[0];
                                    const idCard = doc.identityCard;

                                    return (
                                        <tr key={doc.id} className={cn("transition-colors", isSelected ? "bg-indigo-50/50" : "hover:bg-slate-50/50")}>
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={() => toggleSelection(doc.id)}
                                                    className="text-slate-400 hover:text-indigo-600"
                                                >
                                                    {isSelected ? (
                                                        <CheckSquare className="h-5 w-5 text-indigo-600" />
                                                    ) : (
                                                        <Square className="h-5 w-5" />
                                                    )}
                                                </button>
                                            </td>
                                            <td className="px-4 py-3 font-mono text-xs text-slate-500">
                                                {doc.id.slice(-6)}
                                            </td>

                                            {category === "IDENTITY_CARD" ? (
                                                <>
                                                    {/* ID Card Data Cells */}
                                                    <td className="px-4 py-3 font-medium text-slate-900">
                                                        {idCard?.fullName || <span className="text-slate-400 italic">Processing...</span>}
                                                    </td>
                                                    <td className="px-4 py-3 font-mono text-xs text-slate-600">
                                                        {idCard?.identityNumber || "-"}
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-600 text-xs text-center">
                                                        {idCard?.dateOfIssue ? new Date(idCard.dateOfIssue).toLocaleDateString('en-GB') : "-"}
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-600 text-xs text-center">
                                                        {idCard?.dateOfExpiry ? new Date(idCard.dateOfExpiry).toLocaleDateString('en-GB') : "-"}
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    {/* Invoice Data Cells */}
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className={cn("h-2.5 w-2.5 rounded-full",
                                                                doc.status === "COMPLETED" ? "bg-green-500" :
                                                                    doc.status === "PROCESSING" ? "bg-amber-400 animate-pulse" :
                                                                        "bg-blue-400"
                                                            )} title={doc.status}></div>
                                                            <span className="text-slate-700">{doc.type}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-900 font-medium">
                                                        {invoice?.supplierName || <span className="text-slate-400 italic">Processing...</span>}
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-600">
                                                        {invoice?.date ? new Date(invoice.date).toLocaleDateString() : "-"}
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-slate-900">
                                                        {invoice?.baseCurrencyAmount ? invoice.baseCurrencyAmount.toFixed(2) : (invoice?.totalAmount || "")}
                                                        <span className="text-xs text-slate-400 ml-1">GBP</span>
                                                    </td>
                                                </>
                                            )}

                                            <td className="px-4 py-3">
                                                <select
                                                    className="w-full text-xs border-slate-200 rounded px-2 py-1 bg-slate-50"
                                                    value={doc.category || "OTHER"} // Handle null category
                                                    onChange={(e) => handleInlineCategoryChange(doc.id, e.target.value)}
                                                    disabled={isRecycleBin}
                                                >
                                                    {CATEGORY_OPTIONS.map(opt => (
                                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                    ))}
                                                    <option value="IDENTITY_CARD">ID Card</option>
                                                </select>
                                            </td>

                                            <td className="px-4 py-3 text-center">
                                                {doc.approvalStatus === "APPROVED" && (
                                                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">
                                                        Approved
                                                    </span>
                                                )}
                                                {doc.approvalStatus === "DENIED" && (
                                                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700">
                                                        Denied
                                                    </span>
                                                )}
                                                {(!doc.approvalStatus || doc.approvalStatus === "PENDING") && (
                                                    <div className="flex items-center justify-center gap-1">
                                                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-700 mr-2">
                                                            Pending
                                                        </span>
                                                        <button
                                                            onClick={() => updateApprovalStatus(doc.id, "APPROVED")}
                                                            className="p-1 hover:bg-green-100 text-green-600 rounded transition-colors"
                                                            title="Approve"
                                                        >
                                                            <Check className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => updateApprovalStatus(doc.id, "DENIED")}
                                                            className="p-1 hover:bg-red-100 text-red-600 rounded transition-colors"
                                                            title="Deny"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {!isRecycleBin && (
                                                        <>
                                                            <Link
                                                                href={`/documents/${doc.id}/process`}
                                                                className="px-3 py-1 bg-slate-100 text-slate-600 rounded hover:bg-slate-200 text-xs font-semibold flex items-center gap-1"
                                                            >
                                                                <Edit className="h-3 w-3" /> Process
                                                            </Link>
                                                        </>
                                                    )}
                                                    {isRecycleBin ? (
                                                        <button
                                                            className="text-slate-400 hover:text-green-500"
                                                            title="Restore"
                                                            onClick={() => restoreDocument(doc.id)}
                                                        >
                                                            <RefreshCw className="h-4 w-4" />
                                                        </button>
                                                    ) : (
                                                        <button className="text-slate-400 hover:text-red-500">
                                                            <Trash2 className="h-4 w-4" onClick={() => softDeleteDocument(doc.id)} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-500">Show</span>
                        <select
                            className="border border-slate-200 rounded text-sm p-1"
                            value={itemsPerPage}
                            onChange={(e) => setItemsPerPage(Number(e.target.value))}
                        >
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                        <span className="text-sm text-slate-500">records</span>
                    </div>
                    <div className="text-sm text-slate-400">
                        {/* Pagination controls placeholder */}
                        Showing 1 to {Math.min(itemsPerPage, documents.length)} of {documents.length} entries
                    </div>
                </div>
            </div>

            {!isRecycleBin && <PdfTools selectedIds={selectedIds} onComplete={handleToolsComplete} />}
        </div>
    );
}

