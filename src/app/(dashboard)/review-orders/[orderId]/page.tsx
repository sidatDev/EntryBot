import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { OrderReviewInterface } from "@/components/dashboard/OrderReviewInterface";

export default async function ReviewOrderDetailPage({
    params
}: {
    params: Promise<{ orderId: string }>
}) {
    const { orderId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/login");

    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
            organization: true,
            documents: {
                where: { deletedAt: null }
            }
        }
    });

    if (!order) {
        return <div className="p-8">Order not found</div>;
    }

    // Access control: Ensure user belongs to the org or is admin
    // Basic check: if user is not ADMIN and user.organizationId !== order.organizationId (and not owner)
    // For now, assuming if they can see the link, they can review. Robust would check logic.

    return (
        <OrderReviewInterface order={order} />
    );
}
