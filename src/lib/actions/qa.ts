"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function submitQualityReview(data: {
    documentId: string;
    reviewerId: string;
    status: "PASSED" | "FAILED" | "NEEDS_CORRECTION";
    score: number;
    notes?: string;
}) {
    // Upsert review
    await prisma.qualityReview.upsert({
        where: { documentId: data.documentId },
        create: {
            documentId: data.documentId,
            reviewerId: data.reviewerId,
            status: data.status,
            score: data.score,
            notes: data.notes
        },
        update: {
            reviewerId: data.reviewerId,
            status: data.status,
            score: data.score,
            notes: data.notes
        }
    });

    // Update document status based on QA result
    let docStatus = "COMPLETED"; // Default if passed
    if (data.status === "FAILED" || data.status === "NEEDS_CORRECTION") {
        docStatus = "REJECTED"; // Or separate "QA_FAILED" status
    }

    await prisma.document.update({
        where: { id: data.documentId },
        data: {
            status: docStatus,
            qaStatus: data.status
        }
    });

    revalidatePath("/qa");
    revalidatePath("/dashboard");
}

export async function getQAQueue(organizationId?: string) {
    const where: any = {
        status: "QA_REVIEW"
    };

    if (organizationId) {
        where.organizationId = organizationId;
    }

    return await prisma.document.findMany({
        where,
        include: {
            user: { select: { name: true } }, // Submitter
            invoices: { take: 1 } // To see amount/details preview
        },
        orderBy: { updatedAt: 'asc' } // Oldest first
    });
}
