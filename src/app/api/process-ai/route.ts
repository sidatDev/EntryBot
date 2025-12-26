import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Define response type from External OCR Service
interface ExternalOCRResponse {
    raw_text: string;
    documentType?: number; // 1 = Invoice, 2 = Statement
    structured_data: {
        // Invoice Fields
        Document_Number?: string | null;
        Document_Date?: string | null;
        Due_Payment_Date?: string | null;
        Contact_Name?: string | null;
        Gross_Amount?: string | null;
        Net_Amount_invoice_currency?: string | null;
        VAT_GST_Amount_invoice_currency?: string | null;
        VAT_GST_Rate_invoice_currency?: string | null;
        Transaction_Currency?: string | null;
        line_items?: Array<{
            item_description?: string;
            unit_price?: string;
            quantity?: string;
            total?: string;
        }>;

        // Bank Statement Fields
        accountTitle?: string | null;
        accountNumber?: string | null;
        iban?: string | null;
        address?: string | null;
        fromDate?: string | null;
        toDate?: string | null;
        currency?: string | null;
        openingBalance?: number | null;
        closingBalance?: number | null;
        transactions?: Array<{
            date?: string;
            bookingDate?: string;
            Description?: string;
            description?: string;
            debit?: number | null;
            credit?: number | null;
            balance?: number | null;
            availableBalance?: number | null;
        }>;
    };
    status: string;
}

function parseDate(dateStr?: string | null): string | null {
    if (!dateStr) return null;
    const parts = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (parts) {
        const day = parts[1].padStart(2, '0');
        const month = parts[2].padStart(2, '0');
        const year = parts[3];
        return `${year}-${month}-${day}`;
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
        return d.toISOString().split('T')[0];
    }
    return null;
}

function parseAmount(amountStr?: string | null): number {
    if (!amountStr) return 0;
    const clean = amountStr.replace(/[^0-9.-]+/g, "");
    return parseFloat(clean) || 0;
}

export async function POST(req: Request) {
    try {
        const { url, documentId } = await req.json();

        if (!url) {
            return NextResponse.json({ error: "URL is required" }, { status: 400 });
        }

        console.log(`[Process-AI] Processing URL: ${url}`);
        const ocrServiceUrl = "https://paddle-ocr.sidattech.com/process-url";

        const response = await fetch(ocrServiceUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[Process-AI] External OCR Service Error: ${response.status} ${errorText}`);
            throw new Error(`OCR Service failed with status ${response.status}`);
        }

        const result = await response.json() as ExternalOCRResponse;
        console.log(`[Process-AI] OCR Success. Status: ${result.status}, Type: ${result.documentType}`);

        const data = result.structured_data;
        let mappedData: any = {};

        // 1 = Invoice (Default), 2 = Statement
        if (result.documentType === 2) {
            // Map Bank Statement
            mappedData = {
                type: "STATEMENT",
                accountTitle: data.accountTitle || "",
                accountNumber: data.accountNumber || "",
                iban: data.iban || "",
                address: data.address || "",
                fromDate: parseDate(data.fromDate),
                toDate: parseDate(data.toDate),
                currency: data.currency || "USD",
                openingBalance: data.openingBalance || 0,
                closingBalance: data.closingBalance || 0,
                transactions: (data.transactions || []).map(t => ({
                    bookingDate: parseDate(t.date || t.bookingDate),
                    description: t.Description || t.description || "",
                    debit: t.debit || 0,
                    credit: t.credit || 0,
                    // If balance is provided in API use it, otherwise mapped to availableBalance
                    availableBalance: t.balance || t.availableBalance || 0
                }))
            };
        } else {
            // Map Invoice
            mappedData = {
                type: "INVOICE",
                invoiceNumber: data.Document_Number || "",
                date: parseDate(data.Document_Date),
                dueDate: parseDate(data.Due_Payment_Date),
                supplierName: data.Contact_Name || "",
                totalAmount: parseAmount(data.Gross_Amount),
                taxTotal: parseAmount(data.VAT_GST_Amount_invoice_currency),
                subTotal: parseAmount(data.Net_Amount_invoice_currency),
                vatRate: parseAmount(data.VAT_GST_Rate_invoice_currency),
                currency: data.Transaction_Currency || "USD",
                lineItems: (data.line_items || []).map(item => ({
                    description: item.item_description || "",
                    quantity: parseAmount(item.quantity || "1"),
                    unitPrice: parseAmount(item.unit_price || "0"),
                    total: parseAmount(item.total || "0")
                }))
            };
        }

        // Update Database with Extracted Text
        if (documentId && result.raw_text) {
            try {
                await prisma.document.update({
                    where: { id: documentId },
                    data: { extractedText: result.raw_text }
                });
                console.log(`[Process-AI] Updated Document ${documentId} with extracted text.`);
            } catch (dbError) {
                console.error(`[Process-AI] Database Update Error:`, dbError);
            }
        }

        return NextResponse.json(mappedData);

    } catch (error: any) {
        console.error("[Process-AI] Error:", error);
        return NextResponse.json(
            { error: "Failed to process document: " + error.message },
            { status: 500 }
        );
    }
}
