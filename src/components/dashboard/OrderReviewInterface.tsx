"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { reviewOrder } from "@/lib/actions/orders";
import { FileText, CheckCircle, XCircle, AlertCircle, ExternalLink, ChevronLeft, Eye } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Document {
    id: string;
    name: string;
    url: string;
    category: string | null;
    status: string;
    extractedText: string | null;
    type: string;
    approvalStatus: string | null;
    rejectionReason: string | null;
}

interface Order {
    id: string;
    orderNumber: string;
    createdAt: Date;
    organization: {
        name: string;
    };
    documents: Document[];
}

export function OrderReviewInterface({ order }: { order: Order }) {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);

    // Track decisions: Map documentId to decision
    const [decisions, setDecisions] = useState<Record<string, { status: 'APPROVED' | 'REJECTED', reason?: string }>>(() => {
        const initialDecisions: Record<string, { status: 'APPROVED' | 'REJECTED', reason?: string }> = {};
        order.documents.forEach(doc => {
            if (doc.approvalStatus === 'APPROVED') {
                initialDecisions[doc.id] = { status: 'APPROVED' };
            }
        });
        return initialDecisions;
    });

    // For rejection modal
    const [rejectingDocId, setRejectingDocId] = useState<string | null>(null);
    const [reasonInput, setReasonInput] = useState("");

    // For file preview modal
    const [previewDoc, setPreviewDoc] = useState<Document | null>(null);

    const handleOpenReject = (docId: string) => {
        setRejectingDocId(docId);
        // Pre-fill if already rejected
        if (decisions[docId]?.status === 'REJECTED') {
            setReasonInput(decisions[docId].reason || "");
        } else {
            setReasonInput("");
        }
    };

    const confirmRejection = () => {
        if (rejectingDocId && reasonInput.trim()) {
            setDecisions(prev => ({
                ...prev,
                [rejectingDocId]: { status: 'REJECTED', reason: reasonInput.trim() }
            }));
            setRejectingDocId(null);
            setReasonInput("");
        }
    };

    const cancelRejection = () => {
        setRejectingDocId(null);
        setReasonInput("");
    };

    const handleApprove = (docId: string) => {
        setDecisions(prev => ({
            ...prev,
            [docId]: { status: 'APPROVED' }
        }));
    };

    const handleSubmitReview = async () => {
        try {
            setSubmitting(true);
            const decisionValues = Object.values(decisions);
            const rejections = Object.entries(decisions)
                .filter(([_, d]) => d.status === 'REJECTED')
                .map(([id, d]) => ({ documentId: id, reason: d.reason || "" }));

            if (rejections.length === 0) {
                // Approve All
                await reviewOrder(order.id, "APPROVE_ALL", []);
            } else {
                // Partial Reject
                await reviewOrder(order.id, "REJECT_PARTIAL", rejections);
            }

            router.push("/review-orders");
            router.refresh();
            toast.success("Order review submitted successfully");
        } catch (error) {
            console.error("Failed to submit review", error);
            toast.error("Failed to submit review. Please try again.");
            setSubmitting(false);
        }
    };

    const totalDocs = order.documents.length;
    const handledDocs = Object.keys(decisions).length;
    const isComplete = handledDocs === totalDocs;

    const approvedCount = Object.values(decisions).filter(d => d.status === 'APPROVED').length;
    const rejectedCount = Object.values(decisions).filter(d => d.status === 'REJECTED').length;

    return (
        <div className="flex flex-col h-[calc(100vh-64px)]">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                <div>
                    <div className="flex items-center text-sm text-slate-500 mb-1">
                        <button onClick={() => router.back()} className="flex items-center hover:text-slate-800 transition-colors mr-2">
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Back to List
                        </button>
                        <span>•</span>
                        <span className="ml-2">{format(new Date(order.createdAt), "MMM d, yyyy")}</span>
                    </div>
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        Review Order <span className="text-blue-600">{order.orderNumber}</span>
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <div className="text-sm font-medium text-slate-900">Summary</div>
                        <div className="text-xs text-slate-500">
                            <span className="text-green-600 font-medium">{approvedCount} Approved</span>
                            {" • "}
                            <span className="text-red-600 font-medium">{rejectedCount} Rejected</span>
                            {" • "}
                            <span className="text-slate-400">{totalDocs - handledDocs} Pending</span>
                        </div>
                    </div>
                    <button
                        onClick={handleSubmitReview}
                        disabled={!isComplete || submitting}
                        className={`px-5 py-2.5 rounded-lg text-sm font-medium text-white shadow-sm transition-all transform active:scale-95 ${!isComplete
                            ? "bg-slate-300 cursor-not-allowed"
                            : rejectedCount > 0
                                ? "bg-amber-600 hover:bg-amber-700"
                                : "bg-green-600 hover:bg-green-700"
                            }`}
                    >
                        {submitting
                            ? "Submitting..."
                            : "Submit Review"
                        }
                    </button>
                </div>
            </header>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                <div className="max-w-5xl mx-auto grid gap-4">
                    {order.documents.map(doc => {
                        const decision = decisions[doc.id];
                        const isApproved = decision?.status === 'APPROVED';
                        const isRejected = decision?.status === 'REJECTED';

                        return (
                            <div
                                key={doc.id}
                                className={`bg-white rounded-xl border p-4 transition-all ${isRejected
                                    ? "border-red-200 ring-1 ring-red-100 bg-red-50/10"
                                    : isApproved
                                        ? "border-green-200 ring-1 ring-green-100 bg-green-50/10"
                                        : "border-slate-200 hover:border-blue-300"
                                    }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4">
                                        <div className="h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <FileText className="h-5 w-5 text-slate-500" />
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-slate-900">{doc.name}</h3>
                                            <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                                                <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 uppercase text-[10px] tracking-wide font-semibold">
                                                    {doc.category || "Uncategorized"}
                                                </span>
                                                {/* View Button */}
                                                <button
                                                    onClick={() => setPreviewDoc(doc)}
                                                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                                >
                                                    <Eye className="h-3 w-3" /> Preview
                                                </button>
                                            </div>

                                            {/* Extracted Data Snippet (Optional) */}
                                            {doc.extractedText && (
                                                <div className="mt-2 text-xs text-slate-400 line-clamp-2 max-w-md bg-slate-50 p-2 rounded">
                                                    {doc.extractedText.substring(0, 100)}...
                                                </div>
                                            )}

                                            {/* Rejection Reason Display */}
                                            {isRejected && (
                                                <div className="mt-3 bg-red-50 text-red-700 text-sm p-3 rounded-lg flex items-start gap-2">
                                                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                                    <div>
                                                        <span className="font-semibold block text-xs uppercase tracking-wide opacity-75">Rejection Reason</span>
                                                        {decisions[doc.id].reason}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-2">
                                            {/* Approve Button */}
                                            <button
                                                onClick={() => handleApprove(doc.id)}
                                                className={`flex items-center gap-1 text-sm font-medium px-4 py-2 rounded-lg transition-all border ${isApproved
                                                    ? "bg-green-600 text-white border-green-600 shadow-sm ring-2 ring-green-100" // Active
                                                    : "bg-white text-slate-500 border-slate-200 hover:border-green-300 hover:text-green-600" // Inactive
                                                    }`}
                                            >
                                                <CheckCircle className="h-4 w-4" />
                                                Approve
                                            </button>

                                            {/* Reject Button */}
                                            <button
                                                onClick={() => handleOpenReject(doc.id)}
                                                className={`flex items-center gap-1 text-sm font-medium px-4 py-2 rounded-lg transition-all border ${isRejected
                                                    ? "bg-red-600 text-white border-red-600 shadow-sm ring-2 ring-red-100" // Active
                                                    : "bg-white text-slate-500 border-slate-200 hover:border-red-300 hover:text-red-600" // Inactive
                                                    }`}
                                            >
                                                <XCircle className="h-4 w-4" />
                                                Reject
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Rejection Modal */}
            {rejectingDocId && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Reject Document</h3>
                        <p className="text-slate-500 text-sm mb-4">
                            Please provide a reason for rejecting this document. The operator will see this feedback.
                        </p>
                        <textarea
                            className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none min-h-[100px]"
                            placeholder="e.g. Image too blurry, incorrect amount entered..."
                            value={reasonInput}
                            onChange={(e) => setReasonInput(e.target.value)}
                            autoFocus
                        />
                        <div className="flex justify-end gap-3 mt-4">
                            <button
                                onClick={cancelRejection}
                                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmRejection}
                                disabled={!reasonInput.trim()}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50 transition-colors"
                            >
                                Confirm Rejection
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* File Preview Modal (Simplified) */}
            {previewDoc && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="font-semibold">{previewDoc.name}</h3>
                            <button onClick={() => setPreviewDoc(null)} className="p-2 hover:bg-slate-100 rounded-full">
                                <XCircle className="h-6 w-6 text-slate-500" />
                            </button>
                        </div>
                        <div className="flex-1 bg-slate-100 relative">
                            {previewDoc.type?.startsWith("image/") ? (
                                <img src={previewDoc.url} alt={previewDoc.name} className="w-full h-full object-contain" />
                            ) : (
                                <iframe src={previewDoc.url} className="w-full h-full" title={previewDoc.name} />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
