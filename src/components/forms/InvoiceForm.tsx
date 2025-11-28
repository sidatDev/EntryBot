"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Plus, Save } from "lucide-react";
import { useState } from "react";

const invoiceSchema = z.object({
    type: z.enum(["SALES", "PURCHASE"]),
    invoiceNumber: z.string().min(1, "Invoice number is required"),
    date: z.string().min(1, "Date is required"),
    supplierName: z.string().optional(),
    customerName: z.string().optional(),
    totalAmount: z.number().min(0),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

export function InvoiceForm({ documentId }: { documentId: string }) {
    const [saving, setSaving] = useState(false);

    const form = useForm<InvoiceFormValues>({
        resolver: zodResolver(invoiceSchema),
        defaultValues: {
            type: "PURCHASE",
            totalAmount: 0,
        },
    });

    const onSubmit = async (data: InvoiceFormValues) => {
        setSaving(true);
        // TODO: Call server action
        console.log(data);
        setTimeout(() => setSaving(false), 1000);
    };

    return (
        <div className="h-full flex flex-col bg-white">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-semibold text-slate-800">Data Entry</h2>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        className="px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100"
                    >
                        New Record
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl mx-auto">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Type</label>
                            <select
                                {...form.register("type")}
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                            >
                                <option value="PURCHASE">Purchase Invoice</option>
                                <option value="SALES">Sales Invoice</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Invoice #</label>
                            <input
                                {...form.register("invoiceNumber")}
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                placeholder="INV-001"
                            />
                            {form.formState.errors.invoiceNumber && (
                                <p className="text-xs text-red-500">{form.formState.errors.invoiceNumber.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Date</label>
                            <input
                                type="date"
                                {...form.register("date")}
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Total Amount</label>
                            <input
                                type="number"
                                step="0.01"
                                {...form.register("totalAmount", { valueAsNumber: true })}
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                            />
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100">
                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-lg shadow-indigo-200 transition-all flex items-center justify-center disabled:opacity-70"
                        >
                            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : "Save Record"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
