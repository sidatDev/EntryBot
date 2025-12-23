"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Save, FileText, Sparkles } from "lucide-react";
import { useState } from "react";
import { LineItemsTable } from "./LineItemsTable";
import { saveInvoice, getDocumentMetadata } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";

const invoiceSchema = z.object({
    type: z.enum(["SALES", "PURCHASE"]),
    invoiceNumber: z.string().min(1, "Invoice number is required"),
    date: z.string().min(1, "Date is required"),
    dueDate: z.string().optional(),
    supplierName: z.string().optional(),
    currency: z.string().default("USD"),
    exchangeRate: z.number().default(1),
    vatRate: z.number().default(0),
    paymentMethod: z.string().optional(),
    customerName: z.string().optional(),
    notes: z.string().optional(),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

interface LineItem {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
}

export function InvoiceForm({ documentId, documentUrl }: { documentId: string; documentUrl: string }) {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [processingAi, setProcessingAi] = useState(false);
    const [lineItems, setLineItems] = useState<LineItem[]>([]);

    const [metadata, setMetadata] = useState<any>(null);

    useEffect(() => {
        getDocumentMetadata(documentId).then(setMetadata);
    }, [documentId]);

    const form = useForm<InvoiceFormValues>({
        resolver: zodResolver(invoiceSchema),
        defaultValues: {
            type: "PURCHASE",
            currency: "USD",
            exchangeRate: 1,
            vatRate: 0,
        },
    });



    const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
    const taxRate = form.watch("vatRate") ? form.watch("vatRate") / 100 : 0;
    const taxTotal = subtotal * taxRate;
    const grandTotal = subtotal + taxTotal;

    const onSubmit = async (data: InvoiceFormValues, saveAndNew: boolean = false) => {
        setSaving(true);
        try {
            await saveInvoice({
                ...data,
                documentId,
                subTotal: subtotal,
                taxTotal: taxTotal,
                totalAmount: grandTotal,
                lineItems: lineItems.map(({ id, ...item }) => item),
            });

            if (saveAndNew) {
                // Reset form for new record
                form.reset({ type: data.type });
                setLineItems([]);
            } else {
                // Redirect back to documents
                router.push("/documents");
            }
        } catch (error) {
            console.error("Failed to save invoice:", error);
        } finally {
            setSaving(false);
        }
    };

    const handleAutoFill = async () => {
        setProcessingAi(true);
        try {
            const response = await fetch("/api/process-ai", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ documentUrl, documentId }),
            });

            if (!response.ok) throw new Error("Failed to process document");

            const data = await response.json();

            // Populate form fields
            if (data.invoiceNumber) form.setValue("invoiceNumber", data.invoiceNumber);
            if (data.date) form.setValue("date", data.date);
            if (data.dueDate) form.setValue("dueDate", data.dueDate);

            // Adjust to purchase if supplier detected, etc. 
            // Simple logic for now: default to PURCHASE
            if (data.supplierName) {
                form.setValue("type", "PURCHASE");
                form.setValue("supplierName", data.supplierName);
            } else if (data.customerName) {
                form.setValue("type", "SALES");
                form.setValue("customerName", data.customerName);
            }

            if (data.lineItems && Array.isArray(data.lineItems)) {
                setLineItems(data.lineItems.map((item: any) => ({
                    id: Math.random().toString(36).substr(2, 9),
                    description: item.description || "",
                    quantity: Number(item.quantity) || 1,
                    unitPrice: Number(item.unitPrice) || 0,
                    total: Number(item.total) || 0
                })));
            }

        } catch (error) {
            console.error("AI Processing Error:", error);
            // Could add a toast notification here
        } finally {
            setProcessingAi(false);
        }
    };

    return (
        <div className="h-full flex flex-col bg-white">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-indigo-600" />
                    <h2 className="font-semibold text-slate-800">Invoice Data Entry</h2>
                </div>
                <button
                    onClick={handleAutoFill}
                    disabled={processingAi}
                    className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-medium disabled:opacity-50"
                >
                    {processingAi ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Sparkles className="h-4 w-4" />
                    )}
                    Auto-fill with AI
                </button>
            </div>

            {/* Read-Only Metadata Header */}
            {metadata && (
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 text-sm grid grid-cols-4 gap-4">
                    <div>
                        <span className="block text-slate-500 text-xs">Document ID</span>
                        <span className="font-medium text-slate-700 truncate block" title={metadata.id}>{metadata.id}</span>
                    </div>
                    <div>
                        <span className="block text-slate-500 text-xs">File Name</span>
                        <span className="font-medium text-slate-700 truncate block" title={metadata.name}>{metadata.name}</span>
                    </div>
                    <div>
                        <span className="block text-slate-500 text-xs">Uploaded By</span>
                        <span className="font-medium text-slate-700">{metadata.user?.name || "Unknown"}</span>
                    </div>
                    <div>
                        <span className="block text-slate-500 text-xs">Upload Date</span>
                        <span className="font-medium text-slate-700">{new Date(metadata.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-y-auto p-6">
                <form className="space-y-8 max-w-4xl mx-auto">
                    {/* Basic Info Section */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Basic Information</h3>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Record Transaction As *</label>
                                <select
                                    {...form.register("type")}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                >
                                    <option value="PURCHASE">Purchase Invoice</option>
                                    <option value="SALES">Sales Invoice</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Document Number *</label>
                                <input
                                    {...form.register("invoiceNumber")}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                    placeholder="INV-2024-001"
                                />
                                {form.formState.errors.invoiceNumber && (
                                    <p className="text-xs text-red-500">{form.formState.errors.invoiceNumber.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Document Date *</label>
                                <input
                                    type="date"
                                    {...form.register("date")}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Due/Payment Date</label>
                                <input
                                    type="date"
                                    {...form.register("dueDate")}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Transaction Details */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Transaction Details</h3>
                        <div className="grid grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Category</label>
                                <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-600">
                                    {metadata?.category || "General"}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Transaction Currency</label>
                                <select
                                    {...form.register("currency")}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                >
                                    <option value="USD">USD ($)</option>
                                    <option value="GBP">GBP (£)</option>
                                    <option value="EUR">EUR (€)</option>
                                    <option value="AUD">AUD ($)</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Exchange Rate</label>
                                <input
                                    type="number"
                                    step="0.0001"
                                    {...form.register("exchangeRate", { valueAsNumber: true })}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Payment Method</label>
                                <select
                                    {...form.register("paymentMethod")}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                >
                                    <option value="">Select Method...</option>
                                    <option value="Cash">Cash</option>
                                    <option value="Bank Transfer">Bank Transfer</option>
                                    <option value="Credit Card">Credit Card</option>
                                    <option value="Debit Card">Debit Card</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Party Details Section */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Party Details</h3>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">
                                    Contact Name
                                </label>
                                <input
                                    {...form.register(form.watch("type") === "PURCHASE" ? "supplierName" : "customerName")}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                    placeholder={form.watch("type") === "PURCHASE" ? "Supplier Name" : "Customer Name"}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Line Items Section */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Line Items</h3>
                        <LineItemsTable items={lineItems} onChange={setLineItems} />
                    </div>

                    {/* Totals Section */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Summary</h3>
                        <div className="flex justify-end">
                            <div className="w-80 space-y-3 bg-slate-50 p-4 rounded-lg">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">Net Amount:</span>
                                    <span className="font-semibold text-slate-900">${subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm items-center">
                                    <span className="text-slate-600">VAT/GST Rate (%):</span>
                                    <input
                                        type="number"
                                        {...form.register("vatRate", { valueAsNumber: true })}
                                        className="w-16 px-1 py-0.5 border rounded text-right text-sm"
                                    />
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">VAT/GST Amount:</span>
                                    <span className="font-semibold text-slate-900">${taxTotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-base pt-2 border-t border-slate-200">
                                    <span className="font-semibold text-slate-700">Gross Amount:</span>
                                    <span className="font-bold text-indigo-600 text-lg">${grandTotal.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Notes Section */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Description</h3>
                        <textarea
                            {...form.register("notes")}
                            rows={3}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-none"
                            placeholder="Add description..."
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-6 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={form.handleSubmit((data) => onSubmit(data, true))}
                            disabled={saving}
                            className="flex-1 py-2.5 bg-white border-2 border-indigo-600 text-indigo-600 font-medium rounded-lg hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                        >
                            <Save className="h-4 w-4" />
                            Save & New Record
                        </button>
                        <button
                            type="button"
                            onClick={form.handleSubmit((data) => onSubmit(data, false))}
                            disabled={saving}
                            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                        >
                            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-4 w-4" />}
                            Save & Close
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
