"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Save, FileText } from "lucide-react";
import { useState } from "react";
import { LineItemsTable } from "./LineItemsTable";
import { saveInvoice } from "@/lib/actions";
import { useRouter } from "next/navigation";

const invoiceSchema = z.object({
    type: z.enum(["SALES", "PURCHASE"]),
    invoiceNumber: z.string().min(1, "Invoice number is required"),
    date: z.string().min(1, "Date is required"),
    dueDate: z.string().optional(),
    supplierName: z.string().optional(),
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

export function InvoiceForm({ documentId }: { documentId: string }) {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [lineItems, setLineItems] = useState<LineItem[]>([]);

    const form = useForm<InvoiceFormValues>({
        resolver: zodResolver(invoiceSchema),
        defaultValues: {
            type: "PURCHASE",
        },
    });

    const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
    const taxRate = 0.1; // 10% tax
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

    return (
        <div className="h-full flex flex-col bg-white">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-indigo-600" />
                    <h2 className="font-semibold text-slate-800">Invoice Data Entry</h2>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                <form className="space-y-8 max-w-4xl mx-auto">
                    {/* Basic Info Section */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Basic Information</h3>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Type *</label>
                                <select
                                    {...form.register("type")}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                >
                                    <option value="PURCHASE">Purchase Invoice</option>
                                    <option value="SALES">Sales Invoice</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Invoice Number *</label>
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
                                <label className="text-sm font-medium text-slate-700">Invoice Date *</label>
                                <input
                                    type="date"
                                    {...form.register("date")}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Due Date</label>
                                <input
                                    type="date"
                                    {...form.register("dueDate")}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Party Details Section */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Party Details</h3>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">
                                    {form.watch("type") === "PURCHASE" ? "Supplier Name" : "Customer Name"}
                                </label>
                                <input
                                    {...form.register(form.watch("type") === "PURCHASE" ? "supplierName" : "customerName")}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                    placeholder={form.watch("type") === "PURCHASE" ? "ABC Suppliers Ltd" : "XYZ Company"}
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
                                    <span className="text-slate-600">Subtotal:</span>
                                    <span className="font-semibold text-slate-900">${subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">Tax (10%):</span>
                                    <span className="font-semibold text-slate-900">${taxTotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-base pt-2 border-t border-slate-200">
                                    <span className="font-semibold text-slate-700">Grand Total:</span>
                                    <span className="font-bold text-indigo-600 text-lg">${grandTotal.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Notes Section */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Additional Notes</h3>
                        <textarea
                            {...form.register("notes")}
                            rows={3}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-none"
                            placeholder="Add any additional notes or comments..."
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
