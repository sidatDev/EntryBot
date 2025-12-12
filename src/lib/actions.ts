"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { writeFile, readFile, unlink } from "fs/promises";
import { join } from "path";
import { mkdir } from "fs/promises";
import { PDFDocument } from "pdf-lib";

export async function uploadDocument(formData: FormData) {
    const file = formData.get("file") as File;
    const userId = formData.get("userId") as string;
    const category = (formData.get("category") as string) || "GENERAL";

    if (!file || !userId) {
        throw new Error("Missing file or user ID");
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Ensure uploads directory exists
    const uploadDir = join(process.cwd(), "public", "uploads");
    try {
        await mkdir(uploadDir, { recursive: true });
    } catch (e) {
        // Ignore if exists
    }

    const fileName = `${Date.now()}-${file.name}`;
    const filePath = join(uploadDir, fileName);
    const publicUrl = `/uploads/${fileName}`;

    await writeFile(filePath, buffer);

    await prisma.document.create({
        data: {
            name: file.name,
            url: publicUrl,
            size: file.size,
            type: file.type.includes("pdf") ? "PDF" : "IMG",
            userId: userId,
            status: "UPLOADED",
            category: category,
        },
    });

    revalidatePath("/documents");
    revalidatePath("/dashboard");
    revalidatePath("/history");
}

export async function mergeDocuments(documentIds: string[], userId: string) {
    if (documentIds.length < 2) throw new Error("Need at least 2 documents to merge");

    const documents = await prisma.document.findMany({
        where: {
            id: { in: documentIds },
            userId: userId,
            type: "PDF",
            status: { not: "DELETED" }
        }
    });

    if (documents.length !== documentIds.length) throw new Error("Some documents not found or not PDFs");

    const mergedPdf = await PDFDocument.create();

    for (const doc of documents) {
        // Resolve absolute path
        const relativePath = doc.url.startsWith("/") ? doc.url.slice(1) : doc.url;
        const filePath = join(process.cwd(), "public", relativePath);

        const pdfBytes = await readFile(filePath);
        const pdf = await PDFDocument.load(pdfBytes);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    const pdfBytes = await mergedPdf.save();

    // Save new file
    const uploadDir = join(process.cwd(), "public", "uploads");
    const fileName = `merged-${Date.now()}.pdf`;
    const filePath = join(uploadDir, fileName);
    const publicUrl = `/uploads/${fileName}`;

    await writeFile(filePath, pdfBytes);

    // Create new document record
    await prisma.document.create({
        data: {
            name: "Merged Document.pdf",
            url: publicUrl,
            size: pdfBytes.length,
            type: "PDF",
            userId: userId,
            status: "UPLOADED",
            category: documents[0].category // Inherit category from first
        }
    });

    revalidatePath("/documents");
}

export async function splitDocument(documentId: string) {
    const doc = await prisma.document.findUnique({ where: { id: documentId } });
    if (!doc || doc.type !== "PDF") throw new Error("Document not found or not PDF");

    const relativePath = doc.url.startsWith("/") ? doc.url.slice(1) : doc.url;
    const filePath = join(process.cwd(), "public", relativePath);

    const pdfBytes = await readFile(filePath);
    const pdf = await PDFDocument.load(pdfBytes);
    const numPages = pdf.getPageCount();

    if (numPages <= 1) throw new Error("Document has only 1 page");

    const uploadDir = join(process.cwd(), "public", "uploads");

    for (let i = 0; i < numPages; i++) {
        const subPdf = await PDFDocument.create();
        const [page] = await subPdf.copyPages(pdf, [i]);
        subPdf.addPage(page);
        const subBytes = await subPdf.save();

        const fileName = `split-${doc.name}-${i + 1}-${Date.now()}.pdf`;
        const subFilePath = join(uploadDir, fileName);
        await writeFile(subFilePath, subBytes);

        await prisma.document.create({
            data: {
                name: `${doc.name} - Page ${i + 1}`,
                url: `/uploads/${fileName}`,
                size: subBytes.length,
                type: "PDF",
                userId: doc.userId,
                status: "UPLOADED",
                category: doc.category
            }
        });
    }

    revalidatePath("/documents");
}

export async function getDocuments(category?: string, status?: string) {
    const whereClause: any = {
        status: { not: "DELETED" }
    };
    if (category && category !== "ALL") {
        whereClause.category = category;
    }
    if (status && status !== "ALL") {
        whereClause.status = status;
    }

    return await prisma.document.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        include: {
            _count: {
                select: { invoices: true },
            },
            invoices: {
                take: 1,
                orderBy: { createdAt: "desc" }
            }
        },
    });
}

export async function getDeletedDocuments() {
    return await prisma.document.findMany({
        where: { status: "DELETED" },
        orderBy: { updatedAt: "desc" }, // Most recently deleted first
        include: {
            invoices: {
                take: 1,
                orderBy: { createdAt: "desc" }
            }
        }
    });
}

// Soft delete
export async function softDeleteDocument(id: string) {
    await prisma.document.update({
        where: { id },
        data: {
            status: "DELETED",
            deletedAt: new Date()
        },
    });
    revalidatePath("/documents");
    revalidatePath("/dashboard");
    revalidatePath("/recycle-bin");
}

// Restore from recycle bin
export async function restoreDocument(id: string) {
    await prisma.document.update({
        where: { id },
        data: {
            status: "UPLOADED", // Or previous status if we tracked it, but UPLOADED is safe
            deletedAt: null
        },
    });
    revalidatePath("/documents");
    revalidatePath("/dashboard");
    revalidatePath("/recycle-bin");
}

// Permanent delete
export async function permanentDeleteDocument(id: string) {
    const doc = await prisma.document.findUnique({ where: { id } });
    if (!doc) return;

    // Delete file from disk
    const relativePath = doc.url.startsWith("/") ? doc.url.slice(1) : doc.url;
    const filePath = join(process.cwd(), "public", relativePath);
    try {
        await unlink(filePath);
    } catch (e) {
        console.error("Failed to delete file:", e);
    }

    // Delete invoices first to avoid relation errors (if not cascaded)
    await prisma.invoice.deleteMany({ where: { documentId: id } });
    await prisma.document.delete({ where: { id } });

    revalidatePath("/recycle-bin");
}

export async function saveInvoice(data: {
    documentId: string;
    type: string;
    invoiceNumber: string;
    date: string;
    dueDate?: string;
    supplierName?: string;
    customerName?: string;
    subTotal: number;
    taxTotal: number;
    totalAmount: number;
    paymentMethod?: string;
    baseCurrencyAmount?: number;
    exchangeRate?: number;
    notes?: string;
    lineItems: Array<{
        description: string;
        quantity: number;
        unitPrice: number;
        total: number;
    }>;
}) {
    const invoice = await prisma.invoice.create({
        data: {
            documentId: data.documentId,
            type: data.type,
            invoiceNumber: data.invoiceNumber,
            date: new Date(data.date),
            dueDate: data.dueDate ? new Date(data.dueDate) : null,
            supplierName: data.supplierName,
            customerName: data.customerName,
            subTotal: data.subTotal,
            taxTotal: data.taxTotal,
            totalAmount: data.totalAmount,
            paymentMethod: data.paymentMethod,
            baseCurrencyAmount: data.baseCurrencyAmount,
            exchangeRate: data.exchangeRate,
            status: "SAVED",
            items: {
                create: data.lineItems,
            },
        },
    });

    // Update document status to PROCESSING
    await prisma.document.update({
        where: { id: data.documentId },
        data: { status: "PROCESSING" },
    });

    revalidatePath("/documents");
    revalidatePath("/dashboard");
    revalidatePath(`/documents/${data.documentId}/process`);

    return invoice;
}

export async function updateDocumentStatus(id: string, status: string) {
    await prisma.document.update({
        where: { id },
        data: { status },
    });

    revalidatePath("/documents");
    revalidatePath("/dashboard");
    revalidatePath(`/documents/${id}/process`);
}

export async function updateDocumentCategory(id: string, category: string) {
    await prisma.document.update({
        where: { id },
        data: { category },
    });
    revalidatePath("/documents");
}

export async function updateInvoicePaymentMethod(invoiceId: string, paymentMethod: string) {
    await prisma.invoice.update({
        where: { id: invoiceId },
        data: { paymentMethod },
    });
    revalidatePath("/documents");
}

export async function getInvoicesByDocument(documentId: string) {
    return await prisma.invoice.findMany({
        where: { documentId },
        include: {
            items: true,
        },
        orderBy: { createdAt: "desc" },
    });
}

export async function exportInvoicesToCSV() {
    const invoices = await prisma.invoice.findMany({
        include: {
            items: true,
            document: true,
        },
        orderBy: { createdAt: "desc" },
    });

    // Create CSV header
    const headers = [
        "Invoice Number",
        "Type",
        "Date",
        "Supplier/Customer",
        "Subtotal",
        "Tax",
        "Total",
        "Currency",
        "Status",
        "Document",
        "Line Items",
    ];

    // Create CSV rows
    const rows = invoices.map((inv) => {
        const party = inv.type === "PURCHASE" ? inv.supplierName : inv.customerName;
        const lineItems = inv.items
            .map((item) => `${item.description} (${item.quantity} x $${item.unitPrice})`)
            .join("; ");

        return [
            inv.invoiceNumber || "",
            inv.type,
            inv.date?.toLocaleDateString() || "",
            party || "",
            inv.subTotal?.toFixed(2) || "0.00",
            inv.taxTotal?.toFixed(2) || "0.00",
            inv.totalAmount?.toFixed(2) || "0.00",
            inv.currency,
            inv.status,
            inv.document.name,
            lineItems,
        ];
    });

    // Combine headers and rows
    const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");

    return csvContent;
}
