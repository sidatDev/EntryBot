"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { reviewOrder } from "@/lib/actions/orders";
import { FileText, CheckCircle, XCircle, AlertCircle, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { FileViewer } from "@/components/operator/FileViewer";
import { InvoiceForm } from "@/components/forms/InvoiceForm";
import { Badge } from "@/components/ui/badge";

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
    updatedAt: Date;
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
    const [selectedDocId, setSelectedDocId] = useState<string | null>(order.documents[0]?.id || null);

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

    const selectedDoc = order.documents.find(d => d.id === selectedDocId);

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

    // Derived state for current doc
    const currentDecision = selectedDocId ? decisions[selectedDocId] : null;
    const isCurrentApproved = currentDecision?.status === 'APPROVED';
    const isCurrentRejected = currentDecision?.status === 'REJECTED';

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] bg-white">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between flex-shrink-0 z-20">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <ChevronLeft className="h-5 w-5 text-slate-600" />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold flex items-center gap-2">
                            Review Order <span className="text-blue-600">{order.orderNumber}</span>
                        </h1>
                        <div className="text-xs text-slate-500">
                            {format(new Date(order.createdAt), "MMM d, yyyy")} • {totalDocs} Documents
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="text-right flex items-center gap-3 text-xs">
                        <div className="flex flex-col items-end">
                            <span className="text-slate-500 font-medium uppercase tracking-wider text-[10px]">Progress</span>
                            <span className="font-semibold text-slate-700">{handledDocs} / {totalDocs} Reviewed</span>
                        </div>
                        <div className="h-8 w-[1px] bg-slate-200"></div>
                        <div className="flex gap-2">
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">{approvedCount} Approved</Badge>
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">{rejectedCount} Rejected</Badge>
                        </div>
                    </div>

                    <button
                        onClick={handleSubmitReview}
                        disabled={!isComplete || submitting}
                        className={`px-5 py-2 rounded-lg text-sm font-medium text-white shadow-sm transition-all transform active:scale-95 ${!isComplete
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

            {/* Main Content - 3 Panes */}
            <div className="flex-1 flex overflow-hidden">

                {/* 1. Left Sidebar: Document List */}
                <div className="w-[300px] border-r border-slate-200 bg-white flex flex-col flex-shrink-0 z-10">
                    <div className="p-3 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Documents</span>
                        <Filter className="h-4 w-4 text-slate-400" />
                    </div>
                    <div className="overflow-y-auto flex-1">
                        {order.documents.map(doc => {
                            const decision = decisions[doc.id];
                            const isApproved = decision?.status === 'APPROVED';
                            const isRejected = decision?.status === 'REJECTED';
                            const isSelected = selectedDocId === doc.id;

                            return (
                                <div
                                    key={doc.id}
                                    onClick={() => setSelectedDocId(doc.id)}
                                    className={`
                                        p-3 border-b border-slate-100 cursor-pointer transition-all hover:bg-slate-50
                                        ${isSelected ? "bg-blue-50/60 border-l-4 border-l-blue-600" : "border-l-4 border-l-transparent"}
                                    `}
                                >
                                    <div className="flex items-start justify-between mb-1">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <FileText className={`h-4 w-4 flex-shrink-0 ${isSelected ? "text-blue-600" : "text-slate-400"}`} />
                                            <span className={`text-sm font-medium truncate ${isSelected ? "text-blue-900" : "text-slate-700"}`}>{doc.name}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pl-6">
                                        <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{doc.category || "General"}</span>

                                        {isApproved && <CheckCircle className="h-4 w-4 text-green-600" />}
                                        {isRejected && <XCircle className="h-4 w-4 text-red-600" />}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 2. Middle Pane: Document Viewer */}
                <div className="flex-1 bg-slate-100 border-r border-slate-200 overflow-hidden relative min-w-[400px]">
                    <FileViewer
                        url={selectedDoc?.url || null}
                        documentId={selectedDoc?.id || null}
                        readOnly={true}
                    />
                </div>

                {/* 3. Right Pane: Form & Decisions */}
                <div className="w-[450px] bg-white flex flex-col flex-shrink-0 shadow-xl z-10">
                    {selectedDoc ? (
                        <>
                            {/* Decision Controls Sticky Header */}
                            <div className="p-4 border-b border-slate-200 bg-white sticky top-0 z-20">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-semibold text-slate-800">Review Data</h3>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleApprove(selectedDoc.id)}
                                            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md transition-all border ${isCurrentApproved
                                                ? "bg-green-600 text-white border-green-600 ring-2 ring-green-100"
                                                : "bg-white text-slate-600 border-slate-300 hover:border-green-500 hover:text-green-600"
                                                }`}
                                        >
                                            <CheckCircle className="h-3.5 w-3.5" /> Approve
                                        </button>
                                        <button
                                            onClick={() => handleOpenReject(selectedDoc.id)}
                                            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md transition-all border ${isCurrentRejected
                                                ? "bg-red-600 text-white border-red-600 ring-2 ring-red-100"
                                                : "bg-white text-slate-600 border-slate-300 hover:border-red-500 hover:text-red-600"
                                                }`}
                                        >
                                            <XCircle className="h-3.5 w-3.5" /> Reject
                                        </button>
                                    </div>
                                </div>
                                {isCurrentRejected && decisions[selectedDoc.id].reason && (
                                    <div className="bg-red-50 text-red-800 text-xs p-2 rounded border border-red-100 flex gap-2 items-start mt-2">
                                        <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                                        <span>{decisions[selectedDoc.id].reason}</span>
                                    </div>
                                )}
                            </div>

                            {/* Form - Read Only */}
                            <div className="flex-1 overflow-y-auto bg-slate-50/50">
                                <InvoiceForm
                                    documentId={selectedDoc.id}
                                    documentUrl={selectedDoc.url}
                                    readOnly={true}
                                />
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-slate-400 p-8 text-center">
                            Select a document to review its extracted data.
                        </div>
                    )}
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
        </div>
    );
}
