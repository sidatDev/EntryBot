"use client";

import { useState, useEffect } from "react";
import { X, FileText, CheckCircle } from "lucide-react";
import { getDocuments } from "@/lib/actions";
import { createOrder } from "@/lib/actions/orders";
import { toast } from "sonner";

interface PlaceOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    category?: "INVOICE" | "STATEMENT" | "OTHER"; // Filter by category
    organizationId?: string; // Filter by organization
}

export function PlaceOrderModal({ isOpen, onClose, onSuccess, category, organizationId }: PlaceOrderModalProps) {
    const [documents, setDocuments] = useState<any[]>([]);
    const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!isOpen) return;

        const loadDocuments = async () => {
            setLoading(true);
            try {
                // Fetch documents with filters passed directly to server for speed
                // getDocuments signature: category, status, assignedToId, unassigned, organizationId, orderId
                let docs = await getDocuments(
                    undefined, // category (we do client side strict filter or improve this later)
                    undefined, // status
                    undefined, // assignedToId
                    undefined, // unassigned
                    organizationId // organizationId (FILTER AT DB LEVEL)
                );
                console.log("📦 Documents fetched from server (filtered by org):", docs.length);

                // Filter out documents that are already in an order
                docs = docs.filter((doc: any) => !doc.orderId);

                // Filter by valid status for ordering
                docs = docs.filter((doc: any) =>
                    doc.status === "UPLOADED" ||
                    doc.status === "PENDING" ||
                    doc.status === "APPROVED" ||
                    doc.status === "REJECTED"
                );

                // Then filter by category if specified
                if (category) {
                    docs = docs.filter((doc: any) => {
                        if (category === "INVOICE") {
                            return doc.category?.includes("INVOICE");
                        } else if (category === "STATEMENT") {
                            return doc.category?.includes("STATEMENT");
                        } else if (category === "OTHER") {
                            return !doc.category?.includes("INVOICE") && !doc.category?.includes("STATEMENT");
                        }
                        return true;
                    });
                    console.log("📦 After category filter:", docs.length, docs.map(d => ({ name: d.name, category: d.category })));
                }

                setDocuments(docs);
            } catch (error) {
                console.error("Failed to load documents", error);
            } finally {
                setLoading(false);
            }
        };

        loadDocuments();
    }, [isOpen, organizationId, category]);

    const toggleDocument = (docId: string) => {
        const newSelected = new Set(selectedDocs);
        if (newSelected.has(docId)) {
            newSelected.delete(docId);
        } else {
            newSelected.add(docId);
        }
        setSelectedDocs(newSelected);
    };

    const handleSubmit = async () => {
        if (selectedDocs.size === 0) {
            toast.error("Please select at least one document");
            return;
        }

        setSubmitting(true);
        try {
            await createOrder(Array.from(selectedDocs), organizationId);
            toast.success("Order placed successfully!");
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error.message || "Failed to place order");
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-900">
                        {category === "INVOICE" && "Place Invoice Order"}
                        {category === "STATEMENT" && "Place Statement Order"}
                        {category === "OTHER" && "Place Other Documents Order"}
                        {!category && "Place Processing Order"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    <p className="text-gray-600 mb-4">
                        Select documents you want to submit for processing. Our data entry team will process them and return the structured data.
                    </p>

                    {loading ? (
                        <div className="text-center py-8 text-gray-500">Loading documents...</div>
                    ) : documents.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                            No documents available to order. Please upload documents first.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {documents.map((doc) => (
                                <div
                                    key={doc.id}
                                    onClick={() => toggleDocument(doc.id)}
                                    className={`p-4 border rounded-lg cursor-pointer transition ${selectedDocs.has(doc.id)
                                        ? "border-blue-500 bg-blue-50"
                                        : "border-gray-200 hover:border-gray-300"
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <FileText
                                                size={20}
                                                className={selectedDocs.has(doc.id) ? "text-blue-600" : "text-gray-400"}
                                            />
                                            <div>
                                                <p className="font-medium text-gray-900">{doc.name}</p>
                                                <p className="text-xs text-gray-500">{doc.category || "General"}</p>
                                            </div>
                                        </div>
                                        {selectedDocs.has(doc.id) && (
                                            <CheckCircle size={20} className="text-blue-600" />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 flex justify-between items-center">
                    <p className="text-sm text-gray-600">
                        {selectedDocs.size} document{selectedDocs.size !== 1 ? "s" : ""} selected
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={submitting || selectedDocs.size === 0}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? "Placing Order..." : "Place Order"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
