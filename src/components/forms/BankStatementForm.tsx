"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Save, FileText, Sparkles, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { saveBankStatement, getDocumentMetadata } from "@/lib/actions";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import * as XLSX from "xlsx";

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

export function BankStatementForm({ documentId, documentUrl, readOnly = false }: { documentId: string; documentUrl: string; readOnly?: boolean }) {
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
                        debit: parseNumber(t.debit),
                        credit: parseNumber(t.credit),
                        availableBalance: parseNumber(t.availableBalance)
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

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 50;

    const totalPages = Math.max(1, Math.ceil(transactions.length / ITEMS_PER_PAGE));
    const paginatedTransactions = transactions.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const goToPage = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
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
        // Jump to last page to see new item
        setTimeout(() => setCurrentPage(Math.ceil((transactions.length + 1) / ITEMS_PER_PAGE)), 0);
    };

    const updateTransaction = (id: string, field: keyof BankTransaction, value: any) => {
        setTransactions(prev => prev.map(t =>
            t.id === id ? { ...t, [field]: value } : t
        ));
    };

    const deleteTransaction = (id: string) => {
        setTransactions(prev => prev.filter(t => t.id !== id));
    };

    // Helper to parse numbers dealing with commas and currency symbols
    const parseNumber = (val: any) => {
        if (!val) return 0;
        if (typeof val === 'number') return val;
        // Remove commas and spaces
        const cleanStr = String(val).replace(/[, ]/g, '');
        const num = parseFloat(cleanStr);
        return isNaN(num) ? 0 : num;
    };

    // CSV Mapping State
    const [showImportModal, setShowImportModal] = useState(false);
    const [csvData, setCsvData] = useState<any[]>([]);
    const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
    const [columnMapping, setColumnMapping] = useState({
        date: "",
        description: "",
        debit: "",
        credit: "",
        balance: ""
    });

    // Helper to find value by fuzzy matching keys
    const findColumnValue = (row: any, keywords: string[]) => {
        const keys = Object.keys(row);
        for (const keyword of keywords) {
            // 1. Exact match
            if (row[keyword] !== undefined) return row[keyword];
            // 2. Case-insensitive match
            const keyMatch = keys.find(k => k.toLowerCase().trim() === keyword.toLowerCase().trim());
            if (keyMatch) return row[keyMatch];
            // 3. Partial match (key contains keyword) - be careful with "Date" vs "Update"
            const partialMatch = keys.find(k => k.toLowerCase().includes(keyword.toLowerCase()));
            if (partialMatch && keyword.length > 3) return row[partialMatch];
        }
        return undefined;
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Reset input for re-selection
        event.target.value = '';

        const processRawData = (data: any[], headers: string[]) => {
            setCsvData(data);
            setCsvHeaders(headers);

            // Auto-guess mapping
            const guess = {
                date: headers.find(h => /date|time/i.test(h)) || "",
                description: headers.find(h => /desc|detail|narration|particular|memo/i.test(h)) || "",
                debit: headers.find(h => /debit|dr|withdraw|paid out/i.test(h)) || "",
                credit: headers.find(h => /credit|cr|deposit|paid in/i.test(h)) || "",
                balance: headers.find(h => /bal|available/i.test(h)) || ""
            };
            setColumnMapping(guess);
            setShowImportModal(true);
        };

        if (file.name.endsWith('.csv')) {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    const headers = results.meta.fields || [];
                    processRawData(results.data, headers);
                },
                error: (error) => {
                    toast.error("Failed to parse CSV", { description: error.message });
                }
            });
        } else {
            const reader = new FileReader();
            reader.onload = (e) => {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);
                const headers = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0] as string[];
                processRawData(jsonData, headers);
            };
            reader.readAsArrayBuffer(file);
        }
    };

    const handleConfirmImport = () => {
        const newTransactions: BankTransaction[] = csvData.map((row: any) => ({
            id: Math.random().toString(36).substr(2, 9),
            bookingDate: row[columnMapping.date] || "",
            description: row[columnMapping.description] || "",
            debit: parseNumber(row[columnMapping.debit]),
            credit: parseNumber(row[columnMapping.credit]),
            availableBalance: parseNumber(row[columnMapping.balance])
        })).filter(t => t.description || t.debit || t.credit);

        setTransactions(prev => [...prev, ...newTransactions]);
        toast.success(`Imported ${newTransactions.length} transactions`);
        setShowImportModal(false);
        setCsvData([]);
    };

    // Styles
    const inputClass = "w-full border-b border-slate-300 focus:border-indigo-600 outline-none px-0 py-2 bg-transparent text-slate-800 placeholder:text-slate-400 sm:text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
    const labelClass = "text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 block";

    return (
        <div className="h-full flex flex-col bg-white overflow-hidden relative">
            {/* Import Modal Overlay */}
            {showImportModal && (
                <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-semibold text-slate-800">Map CSV Columns</h3>
                            <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-slate-600">
                                <Trash2 className="h-4 w-4 rotate-45" /> {/* Close icon hack using Trash/Plus/X if X not imported, assume X is not imported but reused Lucide icons are often multipurpose */}
                            </button>
                        </div>

                        <div className="p-6 space-y-4 overflow-y-auto">
                            <p className="text-sm text-slate-500 mb-4">
                                Please confirm which columns from your file match the required fields.
                            </p>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-semibold text-slate-700 mb-1 block">Booking Date</label>
                                    <select
                                        className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                                        value={columnMapping.date}
                                        onChange={(e) => setColumnMapping(prev => ({ ...prev, date: e.target.value }))}
                                    >
                                        <option value="">-- Select Column --</option>
                                        {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-700 mb-1 block">Description</label>
                                    <select
                                        className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                                        value={columnMapping.description}
                                        onChange={(e) => setColumnMapping(prev => ({ ...prev, description: e.target.value }))}
                                    >
                                        <option value="">-- Select Column --</option>
                                        {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-semibold text-emerald-700 mb-1 block">Credit (Deposit)</label>
                                        <select
                                            className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                                            value={columnMapping.credit}
                                            onChange={(e) => setColumnMapping(prev => ({ ...prev, credit: e.target.value }))}
                                        >
                                            <option value="">-- Select Column (Optional) --</option>
                                            {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-red-700 mb-1 block">Debit (Withdrawal)</label>
                                        <select
                                            className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                                            value={columnMapping.debit}
                                            onChange={(e) => setColumnMapping(prev => ({ ...prev, debit: e.target.value }))}
                                        >
                                            <option value="">-- Select Column (Optional) --</option>
                                            {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-700 mb-1 block">Running Balance</label>
                                    <select
                                        className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                                        value={columnMapping.balance}
                                        onChange={(e) => setColumnMapping(prev => ({ ...prev, balance: e.target.value }))}
                                    >
                                        <option value="">-- Select Column (Optional) --</option>
                                        {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                            <button
                                onClick={() => setShowImportModal(false)}
                                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmImport}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm"
                            >
                                Import Data
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                {!readOnly && (
                    <button
                        onClick={handleAutoFill}
                        disabled={processingAi}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-emerald-100 text-emerald-600 rounded-full hover:bg-emerald-50 hover:border-emerald-200 transition-all text-sm font-medium shadow-sm disabled:opacity-50"
                    >
                        {processingAi ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                        Auto-fill
                    </button>
                )}
            </div>

            {/* Scrollable Area */}
            <div className="flex-1 overflow-y-auto">
                <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-6xl mx-auto p-8 space-y-8">

                    {/* Hidden File Input for Import */}
                    <input
                        type="file"
                        id="transaction-import"
                        accept=".csv,.xlsx,.xls"
                        className="hidden"
                        onChange={handleFileUpload}
                    />

                    {/* Account Details */}
                    <div className="grid grid-cols-12 gap-x-8 gap-y-6">
                        <div className="col-span-12">
                            <h3 className="text-sm font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">Account Information</h3>
                        </div>
                        <div className="col-span-6">
                            <label className={labelClass}>Account Title</label>
                            <input {...form.register("accountTitle")} className={inputClass} placeholder="e.g. John Doe" disabled={readOnly} />
                        </div>
                        <div className="col-span-6">
                            <label className={labelClass}>Account Number</label>
                            <input {...form.register("accountNumber")} className={inputClass} placeholder="e.g. 123456789" disabled={readOnly} />
                        </div>
                        <div className="col-span-6">
                            <label className={labelClass}>IBAN</label>
                            <input {...form.register("iban")} className={inputClass} placeholder="e.g. US123456789" disabled={readOnly} />
                        </div>
                        <div className="col-span-2">
                            <label className={labelClass}>Currency</label>
                            <select {...form.register("currency")} className={inputClass} disabled={readOnly}>
                                <option value="USD">USD ($)</option>
                                <option value="GBP">GBP (£)</option>
                                <option value="EUR">EUR (€)</option>
                            </select>
                        </div>
                        <div className="col-span-12">
                            <label className={labelClass}>Address</label>
                            <input {...form.register("address")} className={inputClass} placeholder="Bank or Account Holder Address" disabled={readOnly} />
                        </div>
                    </div>

                    {/* Period & Balances */}
                    <div className="grid grid-cols-12 gap-x-8 gap-y-6 mt-8">
                        <div className="col-span-12">
                            <h3 className="text-sm font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">Statement Period & Balances</h3>
                        </div>
                        <div className="col-span-3">
                            <label className={labelClass}>From Date</label>
                            <input type="date" {...form.register("fromDate")} className={inputClass} disabled={readOnly} />
                        </div>
                        <div className="col-span-3">
                            <label className={labelClass}>To Date</label>
                            <input type="date" {...form.register("toDate")} className={inputClass} disabled={readOnly} />
                        </div>
                        <div className="col-span-3">
                            <label className={labelClass}>Opening Balance</label>
                            <input type="number" step="0.01" {...form.register("openingBalance", { valueAsNumber: true })} className={inputClass + " text-right"} disabled={readOnly} />
                        </div>
                        <div className="col-span-3">
                            <label className={labelClass}>Closing Balance</label>
                            <input type="number" step="0.01" {...form.register("closingBalance", { valueAsNumber: true })} className={inputClass + " text-right"} disabled={readOnly} />
                        </div>
                    </div>

                    {/* Transactions */}
                    <div className="mt-8 border-t border-slate-100 pt-8">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-slate-900">Transactions <span className="text-slate-400 font-normal ml-2">({transactions.length} total)</span></h3>
                            {!readOnly && (
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => document.getElementById('transaction-import')?.click()}
                                        className="flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-indigo-600 transition-colors"
                                    >
                                        <Upload className="h-3 w-3" /> Import CSV/Excel
                                    </button>
                                    <div className="h-4 w-px bg-slate-200" />
                                    <button type="button" onClick={addTransaction} className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700">
                                        <Plus className="h-3 w-3" /> Add Transaction
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Pagination Controls (Top) */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-end gap-2 mb-2">
                                <span className="text-xs text-slate-500 mr-2">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => goToPage(1)}
                                    disabled={currentPage === 1}
                                    className="px-2 py-1 text-xs border rounded hover:bg-slate-50 disabled:opacity-50"
                                    title="First Page"
                                >
                                    &lt;&lt;
                                </button>
                                <button
                                    type="button"
                                    onClick={() => goToPage(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="px-2 py-1 text-xs border rounded hover:bg-slate-50 disabled:opacity-50"
                                >
                                    Previous
                                </button>
                                <button
                                    type="button"
                                    onClick={() => goToPage(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="px-2 py-1 text-xs border rounded hover:bg-slate-50 disabled:opacity-50"
                                >
                                    Next
                                </button>
                                <button
                                    type="button"
                                    onClick={() => goToPage(totalPages)}
                                    disabled={currentPage === totalPages}
                                    className="px-2 py-1 text-xs border rounded hover:bg-slate-50 disabled:opacity-50"
                                    title="Last Page"
                                >
                                    &gt;&gt;
                                </button>
                            </div>
                        )}

                        <div className="overflow-x-auto border border-slate-100 rounded-lg">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50/50">
                                    <tr>
                                        <th className="py-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider w-32">Date</th>
                                        <th className="py-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description</th>
                                        <th className="py-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right w-32">Debit</th>
                                        <th className="py-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right w-32">Credit</th>
                                        <th className="py-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right w-32">Balance</th>
                                        {!readOnly && <th className="w-10"></th>}
                                    </tr>
                                </thead>
                                <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
                                    {paginatedTransactions.map((t) => (
                                        <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="p-1">
                                                <input
                                                    type="date"
                                                    value={t.bookingDate}
                                                    onChange={(e) => updateTransaction(t.id, "bookingDate", e.target.value)}
                                                    className="w-full px-2 py-1.5 bg-transparent rounded hover:bg-white focus:bg-white focus:ring-1 focus:ring-indigo-200 outline-none transition-all disabled:opacity-50"
                                                    disabled={readOnly}
                                                />
                                            </td>
                                            <td className="p-1">
                                                <input
                                                    type="text"
                                                    value={t.description}
                                                    onChange={(e) => updateTransaction(t.id, "description", e.target.value)}
                                                    className="w-full px-2 py-1.5 bg-transparent rounded hover:bg-white focus:bg-white focus:ring-1 focus:ring-indigo-200 outline-none transition-all disabled:opacity-50"
                                                    placeholder="Details..."
                                                    disabled={readOnly}
                                                />
                                            </td>
                                            <td className="p-1">
                                                <input
                                                    type="number" step="0.01"
                                                    value={t.debit || ''}
                                                    onChange={(e) => updateTransaction(t.id, "debit", parseFloat(e.target.value) || 0)}
                                                    className="w-full px-2 py-1.5 text-right bg-transparent rounded hover:bg-white focus:bg-white focus:ring-1 focus:ring-red-200 outline-none transition-all text-red-600 disabled:opacity-50"
                                                    disabled={readOnly}
                                                />
                                            </td>
                                            <td className="p-1">
                                                <input
                                                    type="number" step="0.01"
                                                    value={t.credit || ''}
                                                    onChange={(e) => updateTransaction(t.id, "credit", parseFloat(e.target.value) || 0)}
                                                    className="w-full px-2 py-1.5 text-right bg-transparent rounded hover:bg-white focus:bg-white focus:ring-1 focus:ring-emerald-200 outline-none transition-all text-emerald-600 disabled:opacity-50"
                                                    disabled={readOnly}
                                                />
                                            </td>
                                            <td className="p-1">
                                                <input
                                                    type="number" step="0.01"
                                                    value={t.availableBalance || ''}
                                                    onChange={(e) => updateTransaction(t.id, "availableBalance", parseFloat(e.target.value) || 0)}
                                                    className="w-full px-2 py-1.5 text-right bg-transparent rounded hover:bg-white focus:bg-white focus:ring-1 focus:ring-indigo-200 outline-none transition-all text-slate-500 font-medium disabled:opacity-50"
                                                    disabled={readOnly}
                                                />
                                            </td>
                                            {!readOnly && (
                                                <td className="p-1 text-center">
                                                    <button type="button" onClick={() => deleteTransaction(t.id)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors">
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                    {paginatedTransactions.length === 0 && (
                                        <tr>
                                            <td colSpan={readOnly ? 5 : 6} className="py-8 text-center text-sm text-slate-400 italic">
                                                No transactions found on this page.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Controls (Bottom) */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between mt-4">
                                <div className="text-xs text-slate-400">
                                    Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, transactions.length)} of {transactions.length} entries
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => goToPage(1)}
                                        disabled={currentPage === 1}
                                        className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        title="First Page"
                                    >
                                        &lt;&lt;
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => goToPage(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Previous
                                    </button>
                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                            let p = i + 1;
                                            if (totalPages > 5) {
                                                // Ensure start page doesn't go below 1 or cause overflow
                                                let startPage = Math.max(1, currentPage - 2);
                                                if (startPage + 4 > totalPages) startPage = totalPages - 4;
                                                p = startPage + i;
                                            }

                                            return (
                                                <button
                                                    key={p}
                                                    type="button"
                                                    onClick={() => goToPage(p)}
                                                    className={`w-7 h-7 flex items-center justify-center text-xs rounded-md transition-colors ${currentPage === p
                                                        ? 'bg-indigo-600 text-white font-medium shadow-sm'
                                                        : 'text-slate-600 hover:bg-slate-100'
                                                        }`}
                                                >
                                                    {p}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => goToPage(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Next
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => goToPage(totalPages)}
                                        disabled={currentPage === totalPages}
                                        className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        title="Last Page"
                                    >
                                        &gt;&gt;
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    {!readOnly && (
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
                    )}
                </form>
            </div>
        </div>
    );
}
