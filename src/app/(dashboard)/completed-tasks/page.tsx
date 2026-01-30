import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCompletedOrders } from "@/lib/actions/orders";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { CheckCircle, Calendar, FileText, ArrowRight } from "lucide-react";
import { format } from "date-fns";

export default async function CompletedTasksPage() {
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

    const orgIds = [
        ...user.ownedOrganizations.map(o => o.id),
        user.organizationId
    ].filter(Boolean) as string[];

    if (orgIds.length === 0) {
        return <div className="p-8 text-center text-slate-500">No organization found.</div>;
    }

    const orders = await getCompletedOrders(orgIds);

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">
                    Completed Tasks
                </h1>
                <p className="text-slate-500 mt-1">
                    History of all approved and completed orders.
                </p>
            </div>

            {orders.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                    <div className="h-12 w-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900 mb-2">No Completed Tasks Yet</h3>
                    <p className="text-slate-500">
                        Orders will appear here once they are fully approved.
                    </p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {orders.map(order => (
                        <div key={order.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col opacity-75 hover:opacity-100 transition-opacity">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <div className="text-sm font-medium text-slate-600 mb-1">{order.orderNumber}</div>
                                    <div className="font-medium text-slate-900">{order.organization.name}</div>
                                </div>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Completed
                                </span>
                            </div>

                            <div className="flex-1 space-y-3 mb-5">
                                <div className="flex items-center text-sm text-slate-500">
                                    <Calendar className="h-4 w-4 mr-2" />
                                    {format(new Date(order.updatedAt), "MMM d, yyyy")}
                                </div>
                                <div className="flex items-center text-sm text-slate-500">
                                    <FileText className="h-4 w-4 mr-2" />
                                    {order.documents.length} Documents
                                </div>
                            </div>

                            {/* Link to detail if needed, or just view summary */}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
