import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getReviewOrders } from "@/lib/actions/orders";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Package, Calendar, FileText, ArrowRight } from "lucide-react";
import { format } from "date-fns";

export default async function ReviewOrdersPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/login");

    // Fetch user's organizations
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
            ownedOrganizations: true,
            organization: true
        }
    });

    if (!user) redirect("/login");

    // Get all relevant Org IDs
    const orgIds = [
        ...user.ownedOrganizations.map(o => o.id),
        user.organizationId
    ].filter(Boolean) as string[];

    if (orgIds.length === 0) {
        return (
            <div className="p-8 text-center text-slate-500">
                You are not part of any organization.
            </div>
        );
    }

    const orders = await getReviewOrders(orgIds);

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                    Review Pending Orders
                </h1>
                <p className="text-slate-500 mt-1">
                    Review and approve orders submitted by operators.
                </p>
            </div>

            {orders.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                    <div className="h-12 w-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Package className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900 mb-2">No Orders to Review</h3>
                    <p className="text-slate-500 max-w-md mx-auto">
                        There are currently no orders waiting for your review. When operators submit orders, they will appear here.
                    </p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {orders.map(order => (
                        <div key={order.id} className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow p-5 flex flex-col">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <div className="text-sm font-medium text-blue-600 mb-1">{order.orderNumber}</div>
                                    <div className="font-medium text-slate-900">{order.organization.name}</div>
                                </div>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                    Needs Review
                                </span>
                            </div>

                            <div className="flex-1 space-y-3 mb-5">
                                <div className="flex items-center text-sm text-slate-500">
                                    <Calendar className="h-4 w-4 mr-2" />
                                    {format(new Date(order.createdAt), "MMM d, yyyy")}
                                </div>
                                <div className="flex items-center text-sm text-slate-500">
                                    <FileText className="h-4 w-4 mr-2" />
                                    {order.documents.length} Documents
                                </div>
                            </div>

                            <Link
                                href={`/review-orders/${order.id}`}
                                className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                            >
                                Start Review
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
