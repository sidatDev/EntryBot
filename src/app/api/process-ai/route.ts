import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { prisma } from "@/lib/prisma";

// Define response type from OCR Service
interface OCRResponse {
    extracted_text: string;
    structured_data: {
        invoiceNumber?: string | null;
        date?: string | null;
        dueDate?: string | null;
        totalAmount?: number | null;
        taxTotal?: number | null;
        subTotal?: number | null;
        supplierName?: string | null;
        customerName?: string | null;
        lineItems?: any[];
    };
    processing_time: number;
}

export async function POST(req: Request) {
    try {
        const { documentUrl, documentId } = await req.json();

        if (!documentUrl) {
            return NextResponse.json({ error: "Document URL is required" }, { status: 400 });
        }

        // Construct full path to the file
        // documentUrl is like "/uploads/123-file.jpg"
        const relativePath = documentUrl.startsWith("/") ? documentUrl.slice(1) : documentUrl;
        const filePath = join(process.cwd(), "public", relativePath);

        // Read file buffer
        const fileBuffer = await readFile(filePath);
        const fileName = relativePath.split('/').pop() || "document.jpg";

        // Call Docker OCR Service
        console.log(`[Process-AI] Sending ${fileName} to OCR Service...`);

        const formData = new FormData();
        const blob = new Blob([fileBuffer], { type: "application/octet-stream" });
        formData.append("file", blob, fileName);

        const ocrServiceUrl = process.env.OCR_SERVICE_URL || "http://localhost:8000/process";

        const response = await fetch(ocrServiceUrl, {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[Process-AI] OCR Service Error: ${response.status} ${errorText}`);
            throw new Error(`OCR Service failed with status ${response.status}`);
        }

        const result = await response.json() as OCRResponse;
        console.log(`[Process-AI] OCR Success. Extracted ${result.extracted_text.length} chars.`);

        // Update Database with Extracted Text
        if (documentId) {
            try {
                await prisma.document.update({
                    where: { id: documentId },
                    data: {
                        extractedText: result.extracted_text,
                        // Could also update status to 'PROCESSED' if desired, but kept simple for now
                    }
                });
                console.log(`[Process-AI] Updated Document ${documentId} with extracted text.`);
            } catch (dbError) {
                console.error(`[Process-AI] Database Update Error:`, dbError);
                // Continue execution to return data to frontend even if DB save fails
            }
        }

        // Return structured data for auto-fill
        return NextResponse.json(result.structured_data);

    } catch (error: any) {
        console.error("[Process-AI] Error:", error);
        return NextResponse.json(
            { error: "Failed to process document: " + error.message },
            { status: 500 }
        );
    }
}
