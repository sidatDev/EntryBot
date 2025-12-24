import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Define response type from External OCR Service
interface ExternalOCRResponse {
    raw_text: string;
    structured_data: {
        Document_Number?: string | null;
        Document_Date?: string | null;
        Due_Payment_Date?: string | null;
        Contact_Name?: string | null;

        // Amounts
        Gross_Amount?: string | null;
        Net_Amount_invoice_currency?: string | null;
        VAT_GST_Amount_invoice_currency?: string | null;
        VAT_GST_Rate_invoice_currency?: string | null;

        // Currency
        Transaction_Currency?: string | null;

        // Line Items
        line_items?: Array<{
            item_description?: string;
            unit_price?: string;
            quantity?: string;
            total?: string;
        }>;
    };
    status: string;
}

function parseDate(dateStr?: string | null): string | null {
    if (!dateStr) return null;
    // Expected format: DD/MM/YYYY
    // Return format: YYYY-MM-DD

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
        // Updated to expect 'url' instead of 'documentUrl'
        const { url, documentId } = await req.json();

        if (!url) {
            return NextResponse.json({ error: "URL is required" }, { status: 400 });
        }

        console.log(`[Process-AI] Processing URL: ${url}`);

        const ocrServiceUrl = "https://paddle-ocr.sidattech.com/process-url";

        // Call External OCR Service
        const response = await fetch(ocrServiceUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ url }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[Process-AI] External OCR Service Error: ${response.status} ${errorText}`);
            throw new Error(`OCR Service failed with status ${response.status}`);
        }

        const result = await response.json() as ExternalOCRResponse;
        console.log(`[Process-AI] OCR Success. Status: ${result.status}`);

        const data = result.structured_data;

        // Map to Internal Format
        const mappedData = {
            invoiceNumber: data.Document_Number || "",
            date: parseDate(data.Document_Date),
            dueDate: parseDate(data.Due_Payment_Date),
            supplierName: data.Contact_Name || "",
            customerName: "",

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

        // Update Database with Extracted Text
        if (documentId && result.raw_text) {
            try {
                await prisma.document.update({
                    where: { id: documentId },
                    data: {
                        extractedText: result.raw_text,
                    }
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
