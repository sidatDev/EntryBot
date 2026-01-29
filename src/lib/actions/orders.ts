"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function createOrder(documentIds: string[]) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        throw new Error("Unauthorized");
    }

    // Fetch user to get their organization (either as member or owner)
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
            ownedOrganizations: true,
            organization: true
        }
    });

    if (!user) {
        throw new Error("User not found");
    }

    // Get organizationId: either from membership or first owned org
    let organizationId = user.organizationId;
    if (!organizationId && user.ownedOrganizations.length > 0) {
        organizationId = user.ownedOrganizations[0].id;
    }

    if (!organizationId) {
        throw new Error("User must belong to an organization");
    }

    // Generate order number
    const count = await prisma.order.count();
    const orderNumber = `ORD-${String(count + 1).padStart(6, '0')}`;

    // Create order
    const order = await prisma.order.create({
        data: {
            orderNumber,
            organizationId,
            status: "PENDING",
        },
    });

    // Link documents to order
    await prisma.document.updateMany({
        where: {
            id: { in: documentIds },
            organizationId, // Ensure documents belong to this org
        },
        data: {
            orderId: order.id,
        },
    });

    return order;
}

export async function getMyOrders() {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return [];
    }

    // Fetch user to get their organization (either as member or owner)
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
            ownedOrganizations: true,
            organization: true
        }
    });

    if (!user) {
        return [];
    }

    // Get organizationId: either from membership or first owned org
    let organizationId = user.organizationId;
    if (!organizationId && user.ownedOrganizations.length > 0) {
        organizationId = user.ownedOrganizations[0].id;
    }

    if (!organizationId) {
        return [];
    }

    const orders = await prisma.order.findMany({
        where: { organizationId },
        include: {
            documents: {
                select: { id: true, name: true, status: true, category: true },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    return orders;
}
