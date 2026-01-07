"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { deductCredits } from "@/lib/billing";
import { shouldFlagForQA } from "@/lib/utils";

export async function saveIdentityCard(data: {
    documentId: string;
    fullName?: string;
    fatherName?: string;
    gender?: string;
    countryOfStay?: string;
    identityNumber?: string;
    dateOfIssue?: string;
    dateOfBirth?: string;
    dateOfExpiry?: string;
    urduFullName?: string;
    urduFatherName?: string;
    currentAddress?: string;
    permanentAddress?: string;
    cardBackUrl?: string;
}) {
    // 1. Create/Update IdentityCard record
    const idCard = await prisma.identityCard.upsert({
        where: { documentId: data.documentId },
        create: {
            documentId: data.documentId,
            fullName: data.fullName,
            fatherName: data.fatherName,
            gender: data.gender,
            countryOfStay: data.countryOfStay,
            identityNumber: data.identityNumber,
            dateOfIssue: data.dateOfIssue ? new Date(data.dateOfIssue) : undefined,
            dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
            dateOfExpiry: data.dateOfExpiry ? new Date(data.dateOfExpiry) : undefined,
            urduFullName: data.urduFullName,
            urduFatherName: data.urduFatherName,
            addressMain: data.currentAddress,      // Map current -> addressMain
            addressSecond: data.permanentAddress,  // Map permanent -> addressSecond
            cardBackUrl: data.cardBackUrl,
        },
        update: {
            fullName: data.fullName,
            fatherName: data.fatherName,
            gender: data.gender,
            countryOfStay: data.countryOfStay,
            identityNumber: data.identityNumber,
            dateOfIssue: data.dateOfIssue ? new Date(data.dateOfIssue) : undefined,
            dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
            dateOfExpiry: data.dateOfExpiry ? new Date(data.dateOfExpiry) : undefined,
            urduFullName: data.urduFullName,
            urduFatherName: data.urduFatherName,
            addressMain: data.currentAddress,      // Map current -> addressMain
            addressSecond: data.permanentAddress,  // Map permanent -> addressSecond
            cardBackUrl: data.cardBackUrl,
        }
    });

    // 2. Billing & Status Updates (Similar to Invoice Logic)
    const doc = await prisma.document.findUnique({
        where: { id: data.documentId },
        select: { organizationId: true }
    });

    if (doc?.organizationId) {
        try {
            await deductCredits(doc.organizationId, 1);
        } catch (e) {
            console.error("Billing error:", e);
        }
    }

    const isQA = shouldFlagForQA(10);
    const nextStatus = isQA ? "QA_REVIEW" : "COMPLETED";

    await prisma.document.update({
        where: { id: data.documentId },
        data: {
            status: nextStatus,
            category: "IDENTITY_CARD" // Ensure category is set
        }
    });

    revalidatePath("/documents");
    revalidatePath("/id-cards");
    revalidatePath(`/documents/${data.documentId}/process`);

    return idCard;
}

export async function getIdentityCards(status?: string) {
    const where: any = {
        category: "IDENTITY_CARD",
        status: { not: "DELETED" }
    };

    if (status && status !== "ALL") {
        where.status = status;
    }

    return await prisma.document.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
            identityCard: true
        }
    });
}
