"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Save, FileText, Sparkles, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { saveBankStatement, getDocumentMetadata } from "@/lib/actions";
import { useRouter } from "next/navigation";

// Schema for Bank Statement
const bankStatementSchema = z.object({
    accountTitle: z.string().optional(),
    accountNumber: z.string().optional(),
    iban: z.string().optional(),
    currency: z.string(),
    address: z.string().optional(),
    fromDate: z.string().optional(),
    toDate: z.string().optional(),
    openingBalance: z.number(),
    closingBalance: z.number(),
});

type BankStatementFormValues = z.infer<typeof bankStatementSchema>;

interface BankTransaction {
    id: string;
    bookingDate: string;
    description: string;
    credit: number;
    debit: number;
    availableBalance: number;
}

export function BankStatementForm({ documentId, documentUrl }: { documentId: string; documentUrl: string }) {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [processingAi, setProcessingAi] = useState(false);
    const [transactions, setTransactions] = useState<BankTransaction[]>([]);
    const [metadata, setMetadata] = useState<any>(null);
    const ocrServiceUrl = process.env.OCR_SERVICE_URL;

    useEffect(() => {
        getDocumentMetadata(documentId).then(setMetadata);
    }, [documentId]);

    const form = useForm<BankStatementFormValues>({
        resolver: zodResolver(bankStatementSchema),
        defaultValues: {
            accountTitle: "",
            accountNumber: "",
            iban: "",
            address: "",
            fromDate: "",
            toDate: "",
            currency: "USD",
            openingBalance: 0,
            closingBalance: 0,
        },
    });

    const onSubmit = async (data: BankStatementFormValues) => {
        setSaving(true);
        try {
            await saveBankStatement({
                documentId,
                ...data,
                transactions: transactions.map(t => ({
                    bookingDate: t.bookingDate,
                    description: t.description,
                    credit: t.credit,
                    debit: t.debit,
                    availableBalance: t.availableBalance
                }))
            });
            router.push("/documents");
        } catch (error) {
            console.error("Failed to save bank statement:", error);
        } finally {
            setSaving(false);
        }
    };

    const handleAutoFill = async () => {
        setProcessingAi(true);
        try {

            const response = await fetch("/api/process-url", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    url: documentUrl,
                    documentType: 2 // 2 for Bank Statement
                }),
            });

            let data;

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));

                // CHECK FOR STRUCTURED ERROR
                if (errorData.detail) {
                    // Show the specific error message
                    const errorMessage = errorData.detail.details || errorData.detail.error?.text || "Validation Error";

                    toast.warning("Attention", {
                        description: errorMessage,
                        duration: 5000,
                    });

                    // Use partial/mapped data if available
                    if (errorData.detail.mapped_data) {
                        data = errorData.detail.mapped_data;
                    } else {
                        throw new Error("Validation Error: " + (errorData.error || `Failed to process document (${response.status})`));
                    }
                } else {
                    throw new Error(errorData.error || `Failed to process document (${response.status})`);
                }
            } else {
                data = await response.json();
            }

            if (data.type === "STATEMENT") {
                // Populate Account Info
                if (data.accountTitle) form.setValue("accountTitle", data.accountTitle);
                if (data.accountNumber) form.setValue("accountNumber", data.accountNumber);
                if (data.iban) form.setValue("iban", data.iban);
                if (data.address) form.setValue("address", data.address);
                if (data.currency) form.setValue("currency", data.currency);

                // Populate Period & Balances
                if (data.fromDate) form.setValue("fromDate", data.fromDate);
                if (data.toDate) form.setValue("toDate", data.toDate);
                if (data.openingBalance !== undefined) form.setValue("openingBalance", data.openingBalance);
                if (data.closingBalance !== undefined) form.setValue("closingBalance", data.closingBalance);

                // Populate Transactions
                if (data.transactions && Array.isArray(data.transactions)) {
                    setTransactions(data.transactions.map((t: any) => ({
                        id: Math.random().toString(36).substr(2, 9),
                        bookingDate: t.bookingDate || "",
                        description: t.description || "",
                        debit: Number(t.debit) || 0,
                        credit: Number(t.credit) || 0,
                        availableBalance: Number(t.availableBalance) || 0
                    })));
                }
            }
        } catch (error: any) {
            // Suppress console error for known validation warnings that have already been toasted
            if (error.message?.includes("Validation Error") || error.message?.includes("Attention:")) {
                console.log("Validation warning handled:", error.message);
                return;
            }

            console.error("AI Processing Error:", error);
            toast.error("Auto-fill Failed", { description: error.message || "Failed to process document." });
        } finally {
            setProcessingAi(false);
        }
    };

    // Transaction Management
    const addTransaction = () => {
        setTransactions([...transactions, {
            id: Math.random().toString(36).substr(2, 9),
            bookingDate: "",
            description: "",
            credit: 0,
            debit: 0,
            availableBalance: 0
        }]);
    };

    const updateTransaction = (id: string, field: keyof BankTransaction, value: any) => {
        setTransactions(prev => prev.map(t =>
            t.id === id ? { ...t, [field]: value } : t
        ));
    };

    const deleteTransaction = (id: string) => {
        setTransactions(prev => prev.filter(t => t.id !== id));
    };

    // Styles
    const inputClass = "w-full border-b border-slate-300 focus:border-indigo-600 outline-none px-0 py-2 bg-transparent text-slate-800 placeholder:text-slate-400 sm:text-sm transition-colors";
    const labelClass = "text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 block";

    return (
        <div className="h-full flex flex-col bg-white">
            {/* Header */}
            <div className="px-8 py-5 flex items-center justify-between border-b border-slate-100/50">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 rounded-lg">
                        <FileText className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                        <h2 className="font-semibold text-slate-800 text-lg leading-tight">Bank Statement Entry</h2>
                        <div className="text-xs text-slate-500 mt-0.5">ID: <span className="font-mono text-slate-700">{documentId.split('-')[0]}...</span></div>
                    </div>
                </div>
                <button
                    onClick={handleAutoFill}
                    disabled={processingAi}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-emerald-100 text-emerald-600 rounded-full hover:bg-emerald-50 hover:border-emerald-200 transition-all text-sm font-medium shadow-sm disabled:opacity-50"
                >
                    {processingAi ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    Auto-fill
                </button>
            </div>

            {/* Scrollable Area */}
            <div className="flex-1 overflow-y-auto">
                <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-6xl mx-auto p-8 space-y-8">

                    {/* Account Details */}
                    <div className="grid grid-cols-12 gap-x-8 gap-y-6">
                        <div className="col-span-12">
                            <h3 className="text-sm font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">Account Information</h3>
                        </div>
                        <div className="col-span-6">
                            <label className={labelClass}>Account Title</label>
                            <input {...form.register("accountTitle")} className={inputClass} placeholder="e.g. John Doe" />
                        </div>
                        <div className="col-span-6">
                            <label className={labelClass}>Account Number</label>
                            <input {...form.register("accountNumber")} className={inputClass} placeholder="e.g. 123456789" />
                        </div>
                        <div className="col-span-6">
                            <label className={labelClass}>IBAN</label>
                            <input {...form.register("iban")} className={inputClass} placeholder="e.g. US123456789" />
                        </div>
                        <div className="col-span-2">
                            <label className={labelClass}>Currency</label>
                            <select {...form.register("currency")} className={inputClass}>
                                <option value="USD">USD ($)</option>
                                <option value="GBP">GBP (£)</option>
                                <option value="EUR">EUR (€)</option>
                            </select>
                        </div>
                        <div className="col-span-12">
                            <label className={labelClass}>Address</label>
                            <input {...form.register("address")} className={inputClass} placeholder="Bank or Account Holder Address" />
                        </div>
                    </div>

                    {/* Period & Balances */}
                    <div className="grid grid-cols-12 gap-x-8 gap-y-6 mt-8">
                        <div className="col-span-12">
                            <h3 className="text-sm font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">Statement Period & Balances</h3>
                        </div>
                        <div className="col-span-3">
                            <label className={labelClass}>From Date</label>
                            <input type="date" {...form.register("fromDate")} className={inputClass} />
                        </div>
                        <div className="col-span-3">
                            <label className={labelClass}>To Date</label>
                            <input type="date" {...form.register("toDate")} className={inputClass} />
                        </div>
                        <div className="col-span-3">
                            <label className={labelClass}>Opening Balance</label>
                            <input type="number" step="0.01" {...form.register("openingBalance", { valueAsNumber: true })} className={inputClass + " text-right"} />
                        </div>
                        <div className="col-span-3">
                            <label className={labelClass}>Closing Balance</label>
                            <input type="number" step="0.01" {...form.register("closingBalance", { valueAsNumber: true })} className={inputClass + " text-right"} />
                        </div>
                    </div>

                    {/* Transactions */}
                    <div className="mt-8 border-t border-slate-100 pt-8">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-slate-900">Transactions</h3>
                            <button type="button" onClick={addTransaction} className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700">
                                <Plus className="h-3 w-3" /> Add Transaction
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr>
                                        <th className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pb-2 w-24">Date</th>
                                        <th className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pb-2 w-64">Description</th>
                                        <th className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pb-2 text-right w-24">Debit</th>
                                        <th className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pb-2 text-right w-24">Credit</th>
                                        <th className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pb-2 text-right w-24">Balance</th>
                                        <th className="w-8"></th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm text-slate-700">
                                    {transactions.map((t) => (
                                        <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                                            <td className="py-1">
                                                <input
                                                    type="date"
                                                    value={t.bookingDate}
                                                    onChange={(e) => updateTransaction(t.id, "bookingDate", e.target.value)}
                                                    className="w-full bg-transparent outline-none focus:text-emerald-600"
                                                />
                                            </td>
                                            <td className="py-1">
                                                <input
                                                    type="text"
                                                    value={t.description}
                                                    onChange={(e) => updateTransaction(t.id, "description", e.target.value)}
                                                    className="w-full bg-transparent outline-none placeholder:text-slate-300"
                                                    placeholder="Transaction details"
                                                />
                                            </td>
                                            <td className="py-1">
                                                <input
                                                    type="number" step="0.01"
                                                    value={t.debit}
                                                    onChange={(e) => updateTransaction(t.id, "debit", parseFloat(e.target.value) || 0)}
                                                    className="w-full text-right bg-transparent outline-none focus:text-red-500"
                                                />
                                            </td>
                                            <td className="py-1">
                                                <input
                                                    type="number" step="0.01"
                                                    value={t.credit}
                                                    onChange={(e) => updateTransaction(t.id, "credit", parseFloat(e.target.value) || 0)}
                                                    className="w-full text-right bg-transparent outline-none focus:text-emerald-500"
                                                />
                                            </td>
                                            <td className="py-1">
                                                <input
                                                    type="number" step="0.01"
                                                    value={t.availableBalance}
                                                    onChange={(e) => updateTransaction(t.id, "availableBalance", parseFloat(e.target.value) || 0)}
                                                    className="w-full text-right bg-transparent outline-none font-medium text-slate-500"
                                                />
                                            </td>
                                            <td className="py-1 text-right">
                                                <button type="button" onClick={() => deleteTransaction(t.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                                                    <Trash2 className="h-3 w-3" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {transactions.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="py-4 text-center text-xs text-slate-400 italic">No transactions added yet</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 pt-10 border-t border-slate-100 mt-8 justify-end">
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-8 py-2.5 bg-emerald-600 text-white font-medium rounded-lg shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                            Save Statement
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
