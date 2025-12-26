"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Save, FileText, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { LineItemsTable } from "./LineItemsTable";
import { saveInvoice, getDocumentMetadata } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

const invoiceSchema = z.object({
    type: z.enum(["SALES", "PURCHASE"]),
    invoiceNumber: z.string().min(1, "Invoice number is required"),
    date: z.string().min(1, "Date is required"),
    dueDate: z.string().optional(),
    supplierName: z.string().optional(),
    currency: z.string().default("USD"),
    invoiceCurrency: z.string().default("USD"),
    exchangeRate: z.number().default(1),

    // Transaction Currency Fields
    netAmount: z.number().default(0),
    vatRate: z.number().default(0),
    taxAmount: z.number().default(0),
    totalAmount: z.number().default(0),

    // Base/Invoice Currency Fields
    baseNetAmount: z.number().default(0),
    baseVatRate: z.number().default(0),
    baseTaxAmount: z.number().default(0),
    baseTotalAmount: z.number().default(0),

    paymentMethod: z.string().optional(),
    contactName: z.string().optional(),
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
            invoiceCurrency: "USD",
            exchangeRate: 1,
            vatRate: 0,
            baseVatRate: 0,
            netAmount: 0,
            taxAmount: 0,
            totalAmount: 0,
            baseNetAmount: 0,
            baseTaxAmount: 0,
            baseTotalAmount: 0,
            contactName: "",
        },
    });

    const { watch, setValue } = form;

    // Watchers for Auto-Calculation
    const exchangeRate = watch("exchangeRate");
    const vatRate = watch("vatRate");
    const netAmount = watch("netAmount");
    const taxAmount = watch("taxAmount");
    const ocrServiceUrl = process.env.OCR_SERVICE_URL;

    // Effect 1: Line Items -> Transaction Net Amount
    useEffect(() => {
        const calculatedSubtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
        if (lineItems.length > 0) {
            setValue("netAmount", Number(calculatedSubtotal.toFixed(2)));
        }
    }, [lineItems, setValue]);

    // Effect 2: Net Amount + VAT Rate -> Tax Amount & Total
    useEffect(() => {
        const calculatedTax = netAmount * (vatRate / 100);
        const calculatedTotal = netAmount + calculatedTax;
        setValue("taxAmount", Number(calculatedTax.toFixed(2)));
        setValue("totalAmount", Number(calculatedTotal.toFixed(2)));
    }, [netAmount, vatRate, setValue]);

    // Effect 3: Sync Base VAT Rate (optional, but requested field)
    useEffect(() => {
        setValue("baseVatRate", vatRate);
    }, [vatRate, setValue]);

    // Effect 4: Transaction Amounts + Exchange Rate -> Base Amounts
    useEffect(() => {
        const rate = exchangeRate || 1;
        setValue("baseNetAmount", Number((netAmount * rate).toFixed(2)));
        setValue("baseTaxAmount", Number((taxAmount * rate).toFixed(2)));
        const currentTotal = netAmount + taxAmount;
        setValue("baseTotalAmount", Number((currentTotal * rate).toFixed(2)));
    }, [netAmount, taxAmount, exchangeRate, setValue]);


    const onSubmit = async (data: InvoiceFormValues, saveAndNew: boolean = false) => {
        setSaving(true);
        try {
            await saveInvoice({
                ...data,
                documentId,
                supplierName: data.type === "PURCHASE" ? data.contactName : undefined,
                customerName: data.type === "SALES" ? data.contactName : undefined,
                subTotal: data.netAmount,
                taxTotal: data.taxAmount,
                totalAmount: data.totalAmount,

                // Server expects baseCurrencyAmount to be the total
                baseCurrencyAmount: data.baseTotalAmount,

                // Pass new explicit fields
                invoiceCurrency: data.invoiceCurrency,
                baseSubTotal: data.baseNetAmount,
                baseTaxTotal: data.baseTaxAmount,
                baseVatRate: data.baseVatRate,

                lineItems: lineItems.map(({ id, ...item }) => item),
            });

            if (saveAndNew) {
                form.reset({
                    type: data.type,
                    currency: "USD",
                    invoiceCurrency: "USD",
                    exchangeRate: 1,
                    vatRate: 0,
                    netAmount: 0,
                    contactName: ""
                });
                setLineItems([]);
            } else {
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
            // INTERNAL PROXY: We must call our own server first to avoid CORS errors and to save data to the DB.
            // Our server then forwards this to https://paddle-ocr.sidattech.com/process-url
            const response = await fetch("/api/process-url", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: documentUrl, documentType: 1 }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Failed to process document (${response.status})`);
            }
            const data = await response.json();

            if (data.invoiceNumber) setValue("invoiceNumber", data.invoiceNumber);
            if (data.date) setValue("date", data.date);
            if (data.dueDate) setValue("dueDate", data.dueDate);

            if (data.supplierName) {
                setValue("type", "PURCHASE");
                setValue("contactName", data.supplierName);
            } else if (data.customerName) {
                setValue("type", "SALES");
                setValue("contactName", data.customerName);
            }

            if (data.currency) {
                setValue("currency", data.currency);
                setValue("invoiceCurrency", data.currency);
            }

            if (data.vatRate) {
                setValue("vatRate", data.vatRate);
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
        } finally {
            setProcessingAi(false);
        }
    };

    // Styles
    const inputClass = "w-full border-b border-slate-300 focus:border-indigo-600 outline-none px-0 py-2 bg-transparent text-slate-800 placeholder:text-slate-400 sm:text-sm transition-colors";
    const labelClass = "text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 block";
    const columnHeaderClass = "text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-4 border-b border-slate-100 pb-2";
    const amountInputClass = "w-full text-right border-b border-slate-300 focus:border-indigo-600 outline-none bg-transparent font-medium sm:text-lg py-1";

    return (
        <div className="h-full flex flex-col bg-white">
            {/* Header / Actions */}
            <div className="px-8 py-5 flex items-center justify-between border-b border-slate-100/50">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 rounded-lg">
                        <FileText className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                        <h2 className="font-semibold text-slate-800 text-lg leading-tight">Invoice Entry</h2>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                            <span>ID: <span className="font-mono text-slate-700">{documentId.split('-')[0]}...</span></span>
                            <span className="text-slate-300">•</span>
                            {watch("type") === "PURCHASE" ? "Purchase" : "Sales"}
                            <span className="text-slate-300">•</span>
                            {metadata && <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal bg-slate-100 text-slate-600 hover:bg-slate-200">{metadata.category}</Badge>}
                        </div>
                    </div>
                </div>
                <button
                    onClick={handleAutoFill}
                    disabled={processingAi}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-indigo-100 text-indigo-600 rounded-full hover:bg-indigo-50 hover:border-indigo-200 transition-all text-sm font-medium shadow-sm disabled:opacity-50"
                >
                    {processingAi ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    Auto-fill
                </button>
            </div>

            {/* Scrollable Form Area */}
            <div className="flex-1 overflow-y-auto">
                <form className="max-w-6xl mx-auto p-8 space-y-8">

                    {/* ROW 1: Contact Name (8) | Document Number (4) */}
                    <div className="grid grid-cols-12 gap-x-8">
                        <div className="col-span-8">
                            <label className={labelClass}>Contact Name *</label>
                            <input
                                {...form.register("contactName")}
                                className={inputClass}
                                placeholder="e.g. Acme Corp"
                            />
                        </div>
                        <div className="col-span-4">
                            <label className={labelClass}>Document Number *</label>
                            <input
                                {...form.register("invoiceNumber")}
                                className={inputClass}
                                placeholder="INV-001"
                            />
                        </div>
                    </div>

                    {/* ROW 2: Dates (3+3) */}
                    <div className="grid grid-cols-12 gap-x-8">
                        <div className="col-span-6">
                            <label className={labelClass}>Document Date *</label>
                            <input type="date" {...form.register("date")} className={inputClass} />
                        </div>
                        <div className="col-span-6">
                            <label className={labelClass}>Due/Payment Date</label>
                            <input type="date" {...form.register("dueDate")} className={inputClass} />
                        </div>
                        <div className="col-span-6"></div>
                    </div>

                    {/* ROW 3: Transaction Currency (3) | Invoice Currency (3) | Exchange Rate (3) */}
                    <div className="grid grid-cols-12 gap-x-8 border-b border-slate-100 pb-8">
                        <div className="col-span-4">
                            <label className={labelClass}>Transaction Currency *</label>
                            <select {...form.register("currency")} className={inputClass}>
                                <option value="USD">USD ($)</option>
                                <option value="GBP">GBP (£)</option>
                                <option value="EUR">EUR (€)</option>
                                <option value="AUD">AUD ($)</option>
                            </select>
                        </div>
                        <div className="col-span-4">
                            <label className={labelClass}>Target/Invoice Currency *</label>
                            <select {...form.register("invoiceCurrency")} className={inputClass}>
                                <option value="USD">USD ($)</option>
                                <option value="GBP">GBP (£)</option>
                                <option value="EUR">EUR (€)</option>
                                <option value="AUD">AUD ($)</option>
                            </select>
                        </div>
                        <div className="col-span-4">
                            <label className={labelClass}>Exchange Rate *</label>
                            <input
                                type="number"
                                step="0.0001"
                                {...form.register("exchangeRate", { valueAsNumber: true })}
                                className={inputClass}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-12 gap-x-12 pt-2">

                        {/* LEFT SIDE: Inputs (Col 1-5) */}

                        <div className="col-span-6 ">
                            <label className={labelClass}>Category *</label>
                            <div className="py-2.5 border-b border-slate-300 text-slate-700 text-sm">
                                {metadata?.category || "General"}
                            </div>
                        </div>
                        <div className="col-span-6 ">
                            <label className={labelClass}>Payment Method *</label>
                            <select {...form.register("paymentMethod")} className={inputClass}>
                                <option value="">None</option>
                                <option value="Cash">Cash</option>
                                <option value="Bank">Bank Transfer</option>
                                <option value="Card">Credit Card</option>
                            </select>
                        </div>
                        <div className="col-span-12 mt-6">
                            <label className={labelClass}>Description / Notes</label>
                            <textarea
                                {...form.register("notes")}
                                rows={2}
                                className={inputClass + " resize-none overflow-hidden"}
                                placeholder="Additional details..."
                            />
                        </div>

                    </div>

                    {/* DETAILS GRID */}
                    <div className="grid grid-cols-12 gap-x-12 pt-2">

                        {/* RIGHT SIDE: Dual Amounts (Col 6-12) */}
                        <div className="col-span-12 grid grid-cols-2 gap-x-8 gap-y-6">
                            {/* Column Headers */}
                            <div className="text-right">
                                <span className={columnHeaderClass}>Transaction ({watch("currency")})</span>
                            </div>
                            <div className="text-right">
                                <span className={columnHeaderClass}>Invoice ({watch("invoiceCurrency")})</span>
                            </div>

                            {/* Net Amount Row */}
                            <div className="border-b border-slate-100 pb-2">
                                <label className={labelClass + " text-right"}>Net Amount</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    {...form.register("netAmount", { valueAsNumber: true })}
                                    className={amountInputClass + " text-slate-700"}
                                />
                            </div>
                            <div className="border-b border-slate-100 pb-2">
                                <label className={labelClass + " text-right"}>Net Amount</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    {...form.register("baseNetAmount", { valueAsNumber: true })}
                                    className={amountInputClass + " text-slate-500"}
                                />
                            </div>

                            {/* VAT Rate/Amount Row */}
                            <div className="border-b border-slate-100 pb-2 flex justify-end items-center gap-4">
                                <div>
                                    <label className={labelClass + " text-right"}>VAT Rate %</label>
                                    <input
                                        type="number"
                                        {...form.register("vatRate", { valueAsNumber: true })}
                                        className="w-12 text-right border-b border-slate-300 focus:border-indigo-600 outline-none text-sm py-1"
                                    />
                                </div>
                                <div>
                                    <label className={labelClass + " text-right"}>VAT Amount</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        {...form.register("taxAmount", { valueAsNumber: true })}
                                        className={amountInputClass + " w-24"}
                                    />
                                </div>
                            </div>
                            <div className="border-b border-slate-100 pb-2 flex justify-end items-center gap-4">
                                <div>
                                    <label className={labelClass + " text-right"}>VAT Rate %</label>
                                    <input
                                        type="number"
                                        {...form.register("baseVatRate", { valueAsNumber: true })}
                                        className="w-12 text-right border-b border-slate-300 outline-none text-sm py-1 text-slate-400"
                                    />
                                </div>
                                <div>
                                    <label className={labelClass + " text-right"}>VAT Amount</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        {...form.register("baseTaxAmount", { valueAsNumber: true })}
                                        className={amountInputClass + " w-24 text-slate-500"}
                                    />
                                </div>
                            </div>

                            {/* Gross Amount Row */}
                            <div className="pt-2">
                                <label className={labelClass + " text-right"}>Gross Amount</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    {...form.register("totalAmount", { valueAsNumber: true })}
                                    className="w-full text-right bg-transparent outline-none font-bold text-indigo-600 text-xl border-b-2 border-transparent focus:border-indigo-600"
                                />
                            </div>
                            <div className="pt-2">
                                <label className={labelClass + " text-right"}>Gross Amount</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    {...form.register("baseTotalAmount", { valueAsNumber: true })}
                                    className="w-full text-right bg-transparent outline-none font-bold text-slate-600 text-xl border-b-2 border-transparent focus:border-slate-300"
                                />
                            </div>

                        </div>
                    </div>


                    {/* Line Items Table (Restored) */}
                    <div className="mt-8 border-t border-slate-100 pt-8">
                        <h3 className="text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wider">Line Items</h3>
                        <LineItemsTable items={lineItems} onChange={setLineItems} />
                    </div>


                    {/* Action Buttons */}
                    <div className="flex gap-4 pt-10 border-t border-slate-100 mt-8">
                        <button
                            type="button"
                            onClick={form.handleSubmit((data) => onSubmit(data, true))}
                            disabled={saving}
                            className="px-6 py-2.5 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            Save & New
                        </button>
                        <button
                            type="button"
                            onClick={form.handleSubmit((data) => onSubmit(data, false))}
                            disabled={saving}
                            className="px-8 py-2.5 bg-indigo-600 text-white font-medium rounded-lg shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center gap-2 ml-auto disabled:opacity-50"
                        >
                            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                            Save Invoice
                        </button>
                    </div>


                </form>
            </div>

            {/* Footer Metadata */}
            {metadata && (
                <div className="px-8 py-4 bg-white border-t border-slate-100 flex items-center gap-12 text-xs text-slate-500 mt-auto">
                    <div>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">File Name:</span>
                        <span className="font-medium text-slate-700 truncate block max-w-[200px]" title={metadata.name}>{metadata.name}</span>
                    </div>
                    <div>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Uploaded By:</span>
                        <span className="font-medium text-slate-700">{metadata.user?.name || "Unknown"}</span>
                    </div>
                    <div>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Upload Date:</span>
                        <span className="font-medium text-slate-700">{new Date(metadata.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
