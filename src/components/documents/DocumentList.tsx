"use client";

import { useState } from "react";
import { FileText, Calendar, ArrowRight, CheckSquare, Square, Download, RefreshCw, Filter, Trash2, Edit, Columns, ArrowRightLeft, FilePlus } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { PdfTools } from "@/components/tools/PdfTools";
import { useRouter } from "next/navigation";
import { updateDocumentCategory, updateInvoicePaymentMethod, softDeleteDocument, restoreDocument, permanentDeleteDocument, exportInvoicesToCSV } from "@/lib/actions";
import { UploadModal } from "@/components/upload/UploadModal";

interface DocumentListProps {
    documents: any[];
    // Type definition refinement could be done in a separate types file
    isRecycleBin?: boolean;
}

const CATEGORY_OPTIONS = ["GENERAL", "SALES", "PURCHASE", "STATEMENT", "OTHER"];
const PAYMENT_METHODS = ["None", "Cash", "Bank Transfer", "Credit Card", "Debit Card", "Commonwealth Bank"]; // Example list

export function DocumentList({ documents, isRecycleBin = false }: DocumentListProps) {
    const router = useRouter();
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [itemsPerPage, setItemsPerPage] = useState(25);

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

    const handleInlineCategoryChange = async (id: string, newCategory: string) => {
        await updateDocumentCategory(id, newCategory);
        // Optimistic update or refresh is handled by server action revalidate, but we might want local state update for speed
        // For now relying on router.refresh() from action
    };

    const handleInlinePaymentMethodChange = async (invoiceId: string, newMethod: string) => {
        if (!invoiceId) return;
        await updateInvoicePaymentMethod(invoiceId, newMethod);
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
        const csv = await exportInvoicesToCSV();
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
        <div className="space-y-4">
            {/* Action Bar - Row 1 (Top Right Actions mostly in blueprint, but we structure for layout) */}
            {!isRecycleBin && (
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-end gap-2 bg-white p-2 rounded-lg border border-slate-200">
                        <button className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded text-sm font-medium hover:bg-indigo-700">
                            <CheckSquare className="h-4 w-4" /> Approve
                        </button>
                        <button className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 text-white rounded text-sm font-medium hover:bg-blue-600">
                            <Edit className="h-4 w-4" /> Bulk Edit
                        </button>
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
                                <th className="px-4 py-3 font-semibold">Doc ID</th>
                                <th className="px-4 py-3 font-semibold">Doc Type</th>
                                <th className="px-4 py-3 font-semibold">Supplier Name</th>
                                <th className="px-4 py-3 font-semibold">Invoice Date</th>
                                <th className="px-4 py-3 font-semibold text-right">Amount <span className="text-xs opacity-75 block">(Invoice Curr.)</span></th>
                                <th className="px-4 py-3 font-semibold text-right">Amount <span className="text-xs opacity-75 block">(Base Curr.)</span></th>
                                <th className="px-4 py-3 font-semibold">Category</th>
                                <th className="px-4 py-3 font-semibold">Payment Method</th>
                                <th className="px-4 py-3 font-semibold text-right">Actions</th>
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
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    {/* Status Indicator Circle */}
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
                                                {invoice?.totalAmount ? invoice.totalAmount.toFixed(2) : ""}
                                                <span className="text-xs text-slate-400 ml-1">{invoice?.currency}</span>
                                            </td>
                                            <td className="px-4 py-3 text-right text-slate-900">
                                                {/* Base Currency simulation (assuming 1:1 or stored) */}
                                                {invoice?.baseCurrencyAmount ? invoice.baseCurrencyAmount.toFixed(2) : (invoice?.totalAmount || "")}
                                                <span className="text-xs text-slate-400 ml-1">GBP</span> {/* Hardcoded for now per image */}
                                            </td>
                                            <td className="px-4 py-3">
                                                <select
                                                    className="w-full text-xs border-slate-200 rounded px-2 py-1 bg-slate-50"
                                                    value={doc.category}
                                                    onChange={(e) => handleInlineCategoryChange(doc.id, e.target.value)}
                                                    disabled={isRecycleBin}
                                                >
                                                    {CATEGORY_OPTIONS.map(opt => (
                                                        <option key={opt} value={opt}>{opt}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-4 py-3">
                                                <select
                                                    className="w-full text-xs border-slate-200 rounded px-2 py-1 bg-slate-50"
                                                    value={invoice?.paymentMethod || "None"}
                                                    onChange={(e) => handleInlinePaymentMethodChange(invoice?.id, e.target.value)}
                                                    disabled={isRecycleBin || !invoice}
                                                >
                                                    {PAYMENT_METHODS.map(opt => (
                                                        <option key={opt} value={opt}>{opt}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {!isRecycleBin && (
                                                        <Link
                                                            href={`/documents/${doc.id}/process`}
                                                            className="px-3 py-1 bg-slate-100 text-slate-600 rounded hover:bg-slate-200 text-xs font-semibold flex items-center gap-1"
                                                        >
                                                            <Edit className="h-3 w-3" /> Approve
                                                        </Link>
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
