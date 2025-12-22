"use server";

import { prisma } from "@/lib/prisma";

export async function generateExport(
    organizationId: string,
    format: "CSV" | "JSON",
    startDate?: Date,
    endDate?: Date
) {
    const where: any = {
        organizationId,
        status: { in: ["COMPLETED", "QA_REVIEW"] } // Only processed docs
    };

    if (startDate) where.updatedAt = { gte: startDate };
    if (endDate) where.updatedAt = { ...where.updatedAt, lte: endDate };

    const documents = await prisma.document.findMany({
        where,
        include: {
            invoices: true
        }
    });

    if (format === "JSON") {
        return JSON.stringify(documents, null, 2);
    }

    // CSV Generation
    const header = "ID,Date,Name,Type,Invoice Number,Supplier,Total,Status\n";
    const rows = documents.map(doc => {
        const inv = doc.invoices[0];
        return [
            doc.id,
            doc.updatedAt.toISOString().split('T')[0],
            `"${doc.name}"`, // Quote to handle commas in names
            doc.type,
            inv?.invoiceNumber || "",
            `"${inv?.supplierName || ""}"`,
            inv?.totalAmount || 0,
            doc.status
        ].join(",");
    });

    return header + rows.join("\n");
}
