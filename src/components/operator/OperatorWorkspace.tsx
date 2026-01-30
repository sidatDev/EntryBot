"use client";

import { useState } from "react";
import { OperatorDocumentList } from "./OperatorDocumentList";
import { FileViewer } from "./FileViewer";
import { InvoiceForm } from "@/components/forms/InvoiceForm";

import { submitOrderForReview } from "@/lib/actions/orders"; // Import action
import { useRouter } from "next/navigation";

export function OperatorWorkspace({ documents, currentUser, orgId, orderId }: { documents: any[], currentUser: any, orgId: string, orderId?: string }) {
    const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const router = useRouter();

    // Check if all documents are processed/completed
    // Adjust based on your status logic. Assuming "COMPLETED" means processed by operator.
    const allProcessed = documents.length > 0 && documents.every(d =>
        d.status === "COMPLETED" ||
        d.status === "REVIEW_REQUIRED" ||
        d.status === "QA_REVIEW"
    );

    const handleSubmit = async () => {
        if (!orderId) return;
        try {
            setSubmitting(true);
            await submitOrderForReview(orderId);
            router.push("/dashboard"); // Return to orders list
        } catch (error) {
            console.error("Failed to submit order", error);
            alert("Failed to submit order. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleInvoiceSaved = (data: any) => {
        const { toast } = require("sonner"); // Dynamic import or use hook if available at top level
        toast.success("Invoice saved successfully");
        router.refresh(); // Refresh server data (update statuses) without leaving page
    };

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] bg-white">
            {/* Header / Actions Bar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 bg-slate-50">
                <div className="text-sm font-medium text-slate-600">
                    Order Documents: {documents.length} | Processed: {documents.filter(d => d.status === "COMPLETED" || d.status === "REVIEW_REQUIRED" || d.status === "QA_REVIEW").length}
                </div>
                {orderId && (
                    <button
                        onClick={handleSubmit}
                        disabled={!allProcessed || submitting}
                        className={`px-4 py-2 text-sm font-semibold rounded shadow transition-colors ${allProcessed
                            ? "bg-green-600 text-white hover:bg-green-700"
                            : "bg-slate-300 text-slate-500 cursor-not-allowed"
                            }`}
                    >
                        {submitting ? "Submitting..." : "Submit for Review"}
                    </button>
                )}
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Left Pane: List */}
                <div className="max-w-[400px] flex-1 flex-shrink-0 h-full border-r border-slate-200">
                    <OperatorDocumentList
                        documents={documents}
                        selectedDocId={selectedDoc?.id || null}
                        onSelectDoc={setSelectedDoc}
                        userId={currentUser.id}
                    />
                </div>

                {/* Middle Pane: Viewer (Flexible) */}
                <div className="max-w-[700px] flex-1 h-full min-w-0 border-r border-slate-200">
                    <FileViewer
                        url={selectedDoc?.url || null}
                        documentId={selectedDoc?.id || null}
                    />
                </div>

                {/* Right Pane: Form (Fixed width like List?) */}
                <div className={`max-w-[600px] flex-1 flex-shrink-0 h-full overflow-y-auto bg-white transition-all duration-300 ${!selectedDoc ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                    {selectedDoc ? (
                        <div className="h-full flex flex-col">
                            {/* Show rejection reason if exists */}
                            {selectedDoc.rejectionReason && (
                                <div className="p-4 bg-red-50 border-b border-red-100 text-red-700 text-sm">
                                    <strong>Returned Reason:</strong> {selectedDoc.rejectionReason}
                                </div>
                            )}
                            <InvoiceForm
                                documentId={selectedDoc.id}
                                documentUrl={selectedDoc.url}
                                onSuccess={handleInvoiceSaved}
                                readOnly={selectedDoc.status === "COMPLETED" || selectedDoc.approvalStatus === "APPROVED"}
                            />
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                            Select a document to edit details
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
