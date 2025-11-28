"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { writeFile } from "fs/promises";
import { join } from "path";
import { mkdir } from "fs/promises";

export async function uploadDocument(formData: FormData) {
    const file = formData.get("file") as File;
    const userId = formData.get("userId") as string;

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
        },
    });

    revalidatePath("/documents");
    revalidatePath("/dashboard");
}

export async function getDocuments() {
    return await prisma.document.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            _count: {
                select: { invoices: true },
            },
        },
    });
}

export async function deleteDocument(id: string) {
    await prisma.document.delete({ where: { id } });
    revalidatePath("/documents");
    revalidatePath("/dashboard");
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
            inv.status,
            inv.document.name,
            lineItems,
        ];
    });

    // Combine headers and rows
    const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");

    return csvContent;
}
