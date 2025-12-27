"use server";

import { prisma } from "@/lib/prisma";

export async function getTeamPerformance(organizationId: string) {
    // 1. Total Docs Processed (Today)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const processedToday = await prisma.document.count({
        where: {
            organizationId,
            status: "COMPLETED",
            updatedAt: { gte: startOfDay }
        }
    });

    // 2. Average Processing Time (Mocked for now as we don't track 'start_processing' time yet)
    // Future: Track time between 'PROCESSING' and 'COMPLETED' status changes in AuditLog

    // 3. QA Error Rate
    const totalReviews = await prisma.qualityReview.count({
        where: {
            document: { organizationId }
        }
    });

    const failedReviews = await prisma.qualityReview.count({
        where: {
            document: { organizationId },
            status: "FAILED"
        }
    });

    const errorRate = totalReviews > 0 ? (failedReviews / totalReviews) * 100 : 0;

    // 4. User Leaderboard
    const topUsers = await prisma.document.groupBy({
        by: ['assignedToId'],
        where: {
            organizationId,
            status: "COMPLETED",
            updatedAt: { gte: startOfDay },
            assignedToId: { not: null }
        },
        _count: {
            id: true
        },
        orderBy: {
            _count: {
                id: 'desc'
            }
        },
        take: 5
    });

    // Resolve User Names
    const leaderboard = await Promise.all(
        topUsers.map(async (entry) => {
            if (!entry.assignedToId) return null;
            const user = await prisma.user.findUnique({
                where: { id: entry.assignedToId },
                select: { name: true }
            });
            return {
                name: user?.name || "Unknown",
                count: entry._count.id
            };
        })
    );

    return {
        processedToday,
        errorRate,
        leaderboard: leaderboard.filter(Boolean) as { name: string; count: number }[]
    };
}

export async function getUserStats(userId: string) {
    const completedDocs = await prisma.document.count({
        where: {
            assignedToId: userId,
            status: "COMPLETED"
        }
    });

    const pendingDocs = await prisma.document.count({
        where: {
            assignedToId: userId,
            status: { in: ["PROCESSING", "PENDING_ENTRY"] }
        }
    });

    // Get recent QA scores
    const qaScores = await prisma.qualityReview.findMany({
        where: {
            document: {
                assignedToId: userId
            }
        },
        select: {
            status: true,
            createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: 10
    });

    const averageScore = qaScores.length > 0
        ? qaScores.reduce((acc, curr) => acc + (curr.status === "PASSED" ? 100 : 0), 0) / qaScores.length
        : 100; // Default to 100 if no reviews

    return {
        completedDocs,
        pendingDocs,
        averageScore: Math.round(averageScore)
    };
}
