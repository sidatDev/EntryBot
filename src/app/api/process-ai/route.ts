import { NextResponse } from "next/server";
import { createWorker } from "tesseract.js";
import { readFile } from "fs/promises";
import { join } from "path";

export async function POST(req: Request) {
    try {
        const { documentUrl } = await req.json();

        if (!documentUrl) {
            return NextResponse.json({ error: "Document URL is required" }, { status: 400 });
        }

        // Construct full path to the file
        // documentUrl is like "/uploads/123-file.jpg"
        const relativePath = documentUrl.startsWith("/") ? documentUrl.slice(1) : documentUrl;
        const filePath = join(process.cwd(), "public", relativePath);

        // Read file buffer
        const fileBuffer = await readFile(filePath);

        // Initialize Tesseract Worker
        const worker = await createWorker("eng");

        // Perform OCR
        const ret = await worker.recognize(fileBuffer);
        const text = ret.data.text;

        await worker.terminate();

        console.log("Extracted Text:", text);

        // Parse Data using Regex (Heuristic)
        const data = parseInvoiceText(text);

        return NextResponse.json(data);

    } catch (error) {
        console.error("OCR Error:", error);
        return NextResponse.json(
            { error: "Failed to process document" },
            { status: 500 }
        );
    }
}

function parseInvoiceText(text: string) {
    const lines = text.split('\n');
    const data: any = {
        invoiceNumber: null,
        date: null,
        dueDate: null,
        totalAmount: null,
        taxTotal: null,
        subTotal: null,
        supplierName: null,
        customerName: null, // Hard to detect without NLP
        lineItems: [] // Hard to extract table structure with regex
    };

    // Helper regex patterns
    const datePattern = /(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})|(\d{4}[\/\.-]\d{1,2}[\/\.-]\d{1,2})|([A-Za-z]{3}\s\d{1,2},?\s\d{4})/;
    const amountPattern = /[\$£€]?\s?(\d{1,3}(?:,\d{3})*\.\d{2})/;
    const invoiceNoPattern = /(?:inv|invoice|bill)\s*(?:no|number|#)?[:\.]?\s*([a-z0-9-]+)/i;

    // Scan lines for key-value pairs
    for (const line of lines) {
        const lowerLine = line.toLowerCase();

        // Invoice Number
        if (!data.invoiceNumber) {
            const match = line.match(invoiceNoPattern);
            if (match && match[1]) {
                data.invoiceNumber = match[1];
                continue;
            }
        }

        // Date
        if (!data.date && (lowerLine.includes('date') && !lowerLine.includes('due'))) {
            const match = line.match(datePattern);
            if (match) {
                // Try to parse date string
                try {
                    const dateKey = match[0];
                    // Naive date parsing
                    const dateObj = new Date(dateKey);
                    if (!isNaN(dateObj.getTime())) {
                        data.date = dateObj.toISOString().split('T')[0];
                    }
                } catch (e) { }
            }
        }

        // Due Date
        if (!data.dueDate && lowerLine.includes('due date')) {
            const match = line.match(datePattern);
            if (match) {
                try {
                    const dateKey = match[0];
                    const dateObj = new Date(dateKey);
                    if (!isNaN(dateObj.getTime())) {
                        data.dueDate = dateObj.toISOString().split('T')[0];
                    }
                } catch (e) { }
            }
        }

        // Total Amount
        if (!data.totalAmount && (lowerLine.includes('total') || lowerLine.includes('amount due') || lowerLine.includes('grand total'))) {
            const match = line.match(amountPattern);
            if (match) {
                data.totalAmount = parseFloat(match[1].replace(/,/g, ''));
            }
        }

        // Tax
        if (!data.taxTotal && (lowerLine.includes('tax') || lowerLine.includes('vat'))) {
            const match = line.match(amountPattern);
            if (match) {
                data.taxTotal = parseFloat(match[1].replace(/,/g, ''));
            }
        }
    }

    // Supplier Name Guess (First non-empty line usually? Or looks for 'Inc', 'Ltd')
    // This is very rough 
    for (const line of lines) {
        if (line.trim().length > 3 && !line.match(datePattern) && !line.match(amountPattern)) {
            // Heuristic: Often the first prominent line is the company name
            // For now, let's just leave it null or pick the first line
            if (!data.supplierName) {
                data.supplierName = line.trim();
                break;
            }
        }
    }

    return data;
}
