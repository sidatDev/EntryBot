"use client";

import { Document } from "@prisma/client";
import { format } from "date-fns";
import {
    CheckSquare,
    Square,
    Download,
    RefreshCw,
    Filter,
    Trash2,
    Edit,
    CreditCard,
    Upload,
    Check,
    X,
    MessageSquare,
    AlertCircle
} from "lucide-react";
import Link from "next/link";
import { UploadModal } from "@/components/upload/UploadModal";
import { useState } from "react";
import { updateApprovalStatus } from "@/lib/actions";
import { useRouter, useSearchParams } from "next/navigation";

interface BankStatementListProps {
    documents: any[];
    isRecycleBin?: boolean;
    currentUser?: any;
    readOnly?: boolean;
}

export function BankStatementList({ documents, isRecycleBin = false, currentUser, readOnly = false }: BankStatementListProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const orgId = searchParams.get("orgId");
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // Rejection Modal State
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectDocId, setRejectDocId] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState("");
    const [rejectError, setRejectError] = useState("");

    // View Rejection Reason Modal State
    const [viewReasonModalOpen, setViewReasonModalOpen] = useState(false);
    const [viewReasonText, setViewReasonText] = useState("");

    const handleRejectSubmit = async () => {
        if (!rejectDocId) return;
        if (!rejectReason.trim()) {
            setRejectError("Reason is required");
            return;
        }

        await updateApprovalStatus(rejectDocId, "DENIED", rejectReason);
        setRejectModalOpen(false);
        setRejectReason("");
        setRejectDocId(null);
        router.refresh();
    };

    const toggleAll = () => {
        if (selectedIds.length === documents.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(documents.map(d => d.id));
        }
    };

    const toggleSelect = (id: string) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(item => item !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    return (
        <>
            {/* Action Bar - Dark Blue */}
            {!readOnly && (
                <div className="bg-blue-600 text-white px-4 py-3 flex items-center gap-3 rounded-t-xl">
                    <UploadModal category="BANK_STATEMENT" organizationId={orgId ?? undefined} />
                    <button
                        onClick={() => {
                            // Simple client-side CSV export
                            const headers = ["Doc ID", "Type", "Name", "Date", "Amount", "Currency", "Status"];
                            const rows = documents.map(doc => [
                                doc.id,
                                doc.type,
                                doc.bankStatement?.displayName || doc.name,
                                doc.bankStatement?.startDate ? format(new Date(doc.bankStatement.startDate), "yyyy-MM-dd") : "",
                                doc.bankStatement?.totalAmount || "",
                                doc.bankStatement?.currency || "GBP",
                                doc.approvalStatus || "PENDING"
                            ]);

                            const csvContent = [
                                headers.join(","),
                                ...rows.map(row => row.map(cell => `"${String(cell || "").replace(/"/g, '""')}"`).join(","))
                            ].join("\n");

                            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                            const url = URL.createObjectURL(blob);
                            const link = document.createElement("a");
                            link.setAttribute("href", url);
                            link.setAttribute("download", `bank_statements_${new Date().toISOString().split('T')[0]}.csv`);
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                        }}
                        className="flex items-center gap-2 px-3 py-1.5 hover:bg-blue-700 rounded text-sm"
                    >
                        <Download className="h-4 w-4" /> Export CSV
                    </button>
                    <button
                        onClick={() => router.refresh()}
                        className="flex items-center gap-2 px-3 py-1.5 hover:bg-blue-700 rounded text-sm"
                        title="Refresh"
                    >
                        <RefreshCw className="h-4 w-4" /> Refresh
                    </button>
                    {/* Filter button removed as it is not implemented */}
                    {/* <button className="flex items-center gap-2 px-3 py-1.5 hover:bg-blue-700 rounded text-sm">
                        <Filter className="h-4 w-4" /> Filter
                    </button> */}
                    <button
                        onClick={async () => {
                            if (confirm(`Are you sure you want to delete ${selectedIds.length} documents?`)) {
                                const { batchSoftDeleteDocuments } = await import("@/lib/actions");
                                await batchSoftDeleteDocuments(selectedIds);
                                setSelectedIds([]);
                                router.refresh();
                            }
                        }}
                        disabled={selectedIds.length === 0}
                        className="flex items-center gap-2 px-3 py-1.5 hover:bg-red-700 rounded text-sm ml-auto disabled:opacity-50"
                    >
                        <Trash2 className="h-4 w-4" /> Delete
                    </button>
                </div>
            )}

            {/* Table */}
            <div className={`bg-white border border-slate-200 shadow-sm overflow-hidden ${readOnly ? "rounded-xl" : "rounded-b-xl"}`}>
                <div className="overflow-x-auto min-h-[500px]">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-cyan-500 text-white font-semibold border-b border-slate-200">
                            <tr>
                                {!readOnly && (
                                    <th className="p-4 w-10">
                                        <button onClick={toggleAll} className="text-white hover:text-slate-100">
                                            {selectedIds.length === documents.length && documents.length > 0 ? (
                                                <CheckSquare className="h-5 w-5" />
                                            ) : (
                                                <Square className="h-5 w-5" />
                                            )}
                                        </button>
                                    </th>
                                )}
                                <th className="p-4 font-semibold">Doc ID</th>
                                <th className="p-4">Doc Type</th>
                                <th className="p-4">Supplier Name</th>
                                <th className="p-4">Invoice Date</th>
                                <th className="p-4">Amount (Base)</th>
                                <th className="p-4">Category</th>
                                <th className="p-4">Approval</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {documents.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="p-8 text-center text-slate-400">
                                        No statements found. Upload one to get started.
                                    </td>
                                </tr>
                            ) : (
                                documents.map((doc) => (
                                    <tr key={doc.id} className="hover:bg-slate-50 group transition-colors">
                                        {!readOnly && (
                                            <td className="p-4">
                                                <button
                                                    onClick={() => toggleSelect(doc.id)}
                                                    className="text-slate-400 hover:text-indigo-600"
                                                >
                                                    {selectedIds.includes(doc.id) ? (
                                                        <CheckSquare className="h-5 w-5 text-indigo-600" />
                                                    ) : (
                                                        <Square className="h-5 w-5" />
                                                    )}
                                                </button>
                                            </td>
                                        )}
                                        <td className="p-4 font-mono text-xs text-slate-500">#{doc.id.slice(-6)}</td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <span className="inline-flex items-center gap-1">
                                                    <span className={`h-2 w-2 rounded-full ${doc.type === "PDF" ? "bg-blue-500" : "bg-green-500"}`}></span>
                                                    {doc.type === "PDF" ? "PDF" : "IMAGE"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4 font-medium text-slate-800">
                                            {doc.bankStatement?.displayName || doc.name}
                                        </td>
                                        <td className="p-4">{doc.bankStatement?.startDate ? format(new Date(doc.bankStatement.startDate), "dd/MM/yyyy") : "—"}</td>
                                        <td className="p-4 font-semibold">
                                            {doc.bankStatement?.currency || "GBP"} {doc.bankStatement?.totalAmount || "—"}
                                        </td>
                                        <td className="p-4">
                                            <span className="text-slate-600">{doc.category || "Bank Statement"}</span>
                                        </td>

                                        {/* Approval Column */}
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                {doc.approvalStatus === "PENDING" && (
                                                    <>
                                                        {!readOnly && currentUser?.id === doc.uploaderId && (
                                                            <>
                                                                <button
                                                                    onClick={async () => {
                                                                        await updateApprovalStatus(doc.id, "APPROVED");
                                                                        router.refresh();
                                                                    }}
                                                                    className="text-green-600 hover:bg-green-50 p-1 rounded"
                                                                    title="Approve"
                                                                >
                                                                    <Check className="h-4 w-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        setRejectDocId(doc.id);
                                                                        setRejectModalOpen(true);
                                                                        setRejectError("");
                                                                        setRejectReason("");
                                                                    }}
                                                                    className="text-red-600 hover:bg-red-50 p-1 rounded"
                                                                    title="Deny"
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </button>
                                                            </>
                                                        )}
                                                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-amber-100 text-amber-700">
                                                            Pending
                                                        </span>
                                                    </>
                                                )}
                                                {doc.approvalStatus === "APPROVED" && (
                                                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">
                                                        Approved
                                                    </span>
                                                )}
                                                {doc.approvalStatus === "DENIED" && (
                                                    <div className="flex items-center gap-1">
                                                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700">
                                                            Denied
                                                        </span>
                                                        {(doc as any).rejectionReason && (
                                                            <button
                                                                onClick={() => {
                                                                    setViewReasonText((doc as any).rejectionReason);
                                                                    setViewReasonModalOpen(true);
                                                                }}
                                                                className="p-1 hover:bg-red-50 rounded transition-colors"
                                                                title="View rejection reason"
                                                            >
                                                                <MessageSquare className="h-4 w-4 text-red-400" />
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </td>

                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {/* Claim Button for Operators */}
                                                {!isRecycleBin && !doc.assignedToId && currentUser?.role === "ENTRY_OPERATOR" && (
                                                    <button
                                                        onClick={async () => {
                                                            const { assignDocumentToMe } = await import("@/lib/actions");
                                                            await assignDocumentToMe(doc.id);
                                                            router.refresh();
                                                        }}
                                                        className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-xs font-semibold flex items-center gap-1"
                                                    >
                                                        <CheckSquare className="h-3 w-3" /> Claim
                                                    </button>
                                                )}

                                                {/* View Button */}
                                                {!isRecycleBin && (doc.assignedToId === currentUser?.id || currentUser?.role !== "ENTRY_OPERATOR") && (
                                                    <Link
                                                        href={`/documents/${doc.id}/process`}
                                                        className="px-3 py-1 bg-slate-100 text-slate-600 rounded hover:bg-slate-200 text-xs font-semibold inline-flex items-center gap-1"
                                                    >
                                                        <Edit className="h-3 w-3" /> View
                                                    </Link>
                                                )}

                                                {/* Delete Button - Only for document owner (client) */}
                                                {!readOnly && !isRecycleBin && currentUser?.id === doc.uploaderId && (
                                                    <button
                                                        onClick={async () => {
                                                            if (confirm("Are you sure you want to delete this document?")) {
                                                                const { softDeleteDocument } = await import("@/lib/actions");
                                                                await softDeleteDocument(doc.id);
                                                                router.refresh();
                                                            }
                                                        }}
                                                        className="text-slate-400 hover:text-red-500 p-1"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="text-sm text-slate-500">
                        Showing <span className="font-medium">{documents.length}</span> of <span className="font-medium">{documents.length}</span>
                    </div>
                </div>
            </div>

            {/* View Rejection Reason Modal */}
            {viewReasonModalOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-start justify-between mb-4">
                            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                <MessageSquare className="h-5 w-5 text-red-500" />
                                Rejection Reason
                            </h3>
                            <button onClick={() => setViewReasonModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <p className="text-sm text-slate-700 whitespace-pre-wrap break-words leading-relaxed">
                                {viewReasonText}
                            </p>
                        </div>

                        <div className="flex justify-end mt-4">
                            <button
                                onClick={() => setViewReasonModalOpen(false)}
                                className="px-4 py-2 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Rejection Modal */}
            {rejectModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-start justify-between mb-4">
                            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                <AlertCircle className="h-5 w-5 text-red-500" />
                                Deny Document
                            </h3>
                            <button onClick={() => setRejectModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <p className="text-sm text-slate-600 mb-4">
                            Please provide a reason for denying this document. This will be visible to the uploader.
                        </p>

                        <textarea
                            value={rejectReason}
                            onChange={(e) => {
                                setRejectReason(e.target.value);
                                setRejectError("");
                            }}
                            placeholder="Enter rejection reason..."
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 min-h-[100px] text-sm"
                        />

                        {rejectError && (
                            <p className="text-red-600 text-sm mt-2">{rejectError}</p>
                        )}

                        <div className="flex justify-end gap-2 mt-4">
                            <button
                                onClick={() => setRejectModalOpen(false)}
                                className="px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRejectSubmit}
                                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                            >
                                Deny Document
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
