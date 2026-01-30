"use server";

import { revalidatePath } from "next/cache";
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

export async function submitOrderForReview(orderId: string) {
    console.log("Submitting order for review:", orderId);
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    try {
        const order = await prisma.order.update({
            where: { id: orderId },
            data: { status: "REVIEW_PENDING" }
        });
        console.log("Order updated successfully:", order);
    } catch (error) {
        console.error("Error updating order status:", error);
        throw error;
    }
}

export async function reviewOrder(orderId: string, action: "APPROVE_ALL" | "REJECT_PARTIAL", rejectionDetails?: { documentId: string, reason: string }[]) {
    console.log(`Reviewing order ${orderId} with action ${action}`);
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    try {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { documents: true }
        });

        if (!order) throw new Error("Order not found");

        if (action === "APPROVE_ALL") {
            console.log("Approving all documents for order:", orderId);
            // Approve all documents
            await prisma.document.updateMany({
                where: { orderId: orderId },
                data: {
                    approvalStatus: "APPROVED",
                    status: "COMPLETED"
                }
            });

            // Complete the order
            await prisma.order.update({
                where: { id: orderId },
                data: { status: "COMPLETED" }
            });
            console.log("Order marked as COMPLETED");

        } else if (action === "REJECT_PARTIAL" && rejectionDetails) {
            console.log("Processing partial rejection for order:", orderId);
            // Handle rejections
            for (const reject of rejectionDetails) {
                await prisma.document.update({
                    where: { id: reject.documentId },
                    data: {
                        approvalStatus: "REJECTED",
                        rejectionReason: reject.reason,
                        status: "RETURNED"
                    }
                });
            }

            // Approve remaining documents
            const rejectedIds = rejectionDetails.map(r => r.documentId);
            await prisma.document.updateMany({
                where: {
                    orderId: orderId,
                    id: { notIn: rejectedIds }
                },
                data: {
                    approvalStatus: "APPROVED",
                    status: "COMPLETED"
                }
            });

            // Send order back to operator
            await prisma.order.update({
                where: { id: orderId },
                data: { status: "RETURNED" }
            });
            console.log("Order marked as RETURNED");
        }

        revalidatePath("/review-orders");
        revalidatePath(`/review-orders/${orderId}`);
        revalidatePath("/completed-tasks");
        revalidatePath("/dashboard"); // Also revalidate operator view just in case

    } catch (error) {
        console.error("Error in reviewOrder:", error);
        throw error;
    }
}

export async function getReviewOrders(organizationIds: string[]) {
    return await prisma.order.findMany({
        where: {
            organizationId: { in: organizationIds },
            status: "REVIEW_PENDING"
        },
        include: {
            organization: true,
            documents: true
        },
        orderBy: { createdAt: "asc" } // Oldest first for review
    });
}

export async function getCompletedOrders(organizationIds: string[]) {
    return await prisma.order.findMany({
        where: {
            organizationId: { in: organizationIds },
            status: "COMPLETED"
        },
        include: {
            organization: true,
            documents: true
        },
        orderBy: { updatedAt: "desc" }
    });
}
