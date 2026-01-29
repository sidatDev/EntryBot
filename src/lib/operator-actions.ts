"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Enhanced Operator Analytics
export async function getOperatorAnalytics() {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ENTRY_OPERATOR") {
        // For testing purposes during dev, if I am ADMIN, allow it.
        if (session?.user?.role !== "ADMIN") return [];
    }

    // Fetch all client organizations
    const orgs = await prisma.organization.findMany({
        where: {
            OR: [{ type: "CLIENT" }, { type: "MASTER_CLIENT" }, { type: "SUB_CLIENT" }]
        },
        include: {
            subscription: true,
        },
        orderBy: { name: "asc" }
    });

    const orgIds = orgs.map(o => o.id);

    // 1. Aggregated Document Stats
    const docStats = await prisma.document.groupBy({
        by: ["organizationId", "category", "source", "status"],
        where: {
            organizationId: { in: orgIds },
            status: { not: "DELETED" }
        },
        _count: { id: true }
    });

    // 2. Login Times
    const lastLogins = await prisma.auditLog.groupBy({
        by: ["organizationId"],
        where: {
            action: "LOGIN",
            organizationId: { in: orgIds }
        },
        _max: { createdAt: true }
    });

    const analytics = await Promise.all(orgs.map(async (org) => {
        const orgDocs = docStats.filter(d => d.organizationId === org.id);

        const sum = (predicate: (d: any) => boolean) =>
            orgDocs.filter(predicate).reduce((acc, curr) => acc + curr._count.id, 0);

        const pendingInvoices = sum(d =>
            (d.category === "SALES_INVOICE" || d.category === "PURCHASE_INVOICE" || d.category === "INVOICE") &&
            (d.status === "UPLOADED" || d.status === "PROCESSING") &&
            d.source !== "SPLIT_OPERATION"
        );

        const splittedInvoices = sum(d =>
            (d.category === "SALES_INVOICE" || d.category === "PURCHASE_INVOICE" || d.category === "INVOICE") &&
            d.source === "SPLIT_OPERATION"
        );

        const pendingStatements = sum(d =>
            (d.category === "BANK_STATEMENT" || d.category === "STATEMENT") &&
            (d.status === "UPLOADED" || d.status === "PROCESSING") &&
            d.source !== "SPLIT_OPERATION"
        );

        const splittedStatements = sum(d =>
            (d.category === "BANK_STATEMENT" || d.category === "STATEMENT") &&
            d.source === "SPLIT_OPERATION"
        );

        const pendingOthers = sum(d =>
            !d.category?.includes("INVOICE") && !d.category?.includes("STATEMENT") &&
            (d.status === "UPLOADED" || d.status === "PROCESSING")
        );

        const inProcess = sum(d => d.status === "PROCESSING");

        // Timestamps
        const oldestDoc = await prisma.document.findFirst({
            where: { organizationId: org.id },
            orderBy: { createdAt: 'asc' },
            select: { createdAt: true }
        });
        const latestDoc = await prisma.document.findFirst({
            where: { organizationId: org.id },
            orderBy: { createdAt: 'desc' },
            select: { createdAt: true }
        });

        const lastLogin = lastLogins.find(l => l.organizationId === org.id)?._max.createdAt;

        const credits = org.subscription?.remainingCredits ?? org.credits ?? 0;
        const processingCredits = 0;

        return {
            id: org.id,
            name: org.name,
            entityName: org.name,
            status: org.status.charAt(0).toUpperCase() + org.status.slice(1).toLowerCase(), // Capitalize
            remainingCredits: credits,
            processingCredits: processingCredits,
            estimatedCredits: credits * 2, // Mock estimation
            oldestDocTime: oldestDoc?.createdAt,
            latestDocTime: latestDoc?.createdAt,
            elapsedTimeLogin: lastLogin,
            stats: {
                pendingInvoices,
                splittedInvoices,
                pendingStatements,
                splittedStatements,
                pendingDocuments: pendingOthers,
                inProcess
            }
        };
    }));

    return analytics;
}

// Order-Based Workflow
export async function getOperatorOrders() {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== "ENTRY_OPERATOR" && session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
        return [];
    }

    const orders = await prisma.order.findMany({
        include: {
            organization: true,
            documents: {
                select: { status: true, category: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    return orders.map(order => {
        const totalDocs = order.documents.length;
        const processedDocs = order.documents.filter(d => d.status === "COMPLETED").length;
        const pendingDocs = order.documents.filter(d => d.status === "PROCESSING" || d.status === "PENDING").length;

        // Determine order status based on docs
        let status = order.status;
        if (totalDocs > 0 && processedDocs === totalDocs) status = "COMPLETED";
        else if (pendingDocs > 0) status = "PROCESSING";

        return {
            id: order.id,
            orderNumber: order.orderNumber,
            clientName: order.organization.name,
            createdAt: order.createdAt,
            status: status,
            stats: {
                total: totalDocs,
                processed: processedDocs,
                pending: pendingDocs
            }
        };
    });
}
