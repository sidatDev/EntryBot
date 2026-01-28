"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function logDocumentActivity(
    documentId: string,
    action: string,
    details?: string
) {
    try {
        const session = await getServerSession(authOptions);
        // Even if no session (system action), we can log without user or passing userId explicitly?
        // For now, rely on session. If system action, we might need an overload.

        await prisma.documentActivity.create({
            data: {
                documentId,
                userId: session?.user?.id || null,
                action,
                details
            }
        });
    } catch (error) {
        console.error("Failed to log activity:", error);
        // Don't throw, just log error so main flow doesn't break
    }
}

export async function getDocumentActivities(documentId: string) {
    try {
        const activities = await prisma.documentActivity.findMany({
            where: { documentId },
            include: {
                user: {
                    select: { name: true, email: true, role: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        return { success: true, activities };
    } catch (error) {
        console.error("Failed to fetch activities:", error);
        return { success: false, error: "Failed to fetch activities" };
    }
}
