"use server";

import { prisma } from "@/lib/prisma";
import { uploadToS3 } from "@/lib/s3";
import { revalidatePath } from "next/cache";
import { hasCredits, deductCredits } from "@/lib/billing";
import { saveIdentityCard } from "./identity-cards"; // Reuse existing if possible, or create internal helper

export async function uploadIdentityCardWithBackImage(formData: FormData) {
    const frontFile = formData.get("frontFile") as File;
    const backFile = formData.get("backFile") as File; // Optional
    const userId = formData.get("userId") as string;

    if (!frontFile || !userId) {
        throw new Error("Missing front file or user ID");
    }

    // Credit Check (similar to uploadDocument)
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { organizationId: true, role: true }
    });

    if (user?.organizationId && user.role !== "ADMIN") {
        const canUpload = await hasCredits(user.organizationId);
        if (!canUpload) throw new Error("Insufficient credits");
    }

    // Upload Front Image
    const frontBuffer = Buffer.from(await frontFile.arrayBuffer());
    const frontUrl = await uploadToS3(frontBuffer, frontFile.name, frontFile.type);

    // Create Main Document
    const doc = await prisma.document.create({
        data: {
            name: frontFile.name,
            url: frontUrl,
            size: frontFile.size,
            type: frontFile.type.startsWith("image/") ? "IMAGE" : "PDF",
            uploaderId: userId,
            status: "UPLOADED",
            category: "IDENTITY_CARD",
            source: "UPLOAD"
        }
    });

    // Handle Back Image if present
    if (backFile) {
        const backBuffer = Buffer.from(await backFile.arrayBuffer());
        const backUrl = await uploadToS3(backBuffer, backFile.name, backFile.type);

        // Create IdentityCard record with back image link
        await prisma.identityCard.create({
            data: {
                documentId: doc.id,
                cardBackUrl: backUrl
            }
        });
    } else {
        // Create empty ID card record just to be safe
        await prisma.identityCard.create({
            data: {
                documentId: doc.id,
            }
        });
    }

    revalidatePath("/documents");
    revalidatePath("/id-cards");

    return { success: true, documentId: doc.id };
}
