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
