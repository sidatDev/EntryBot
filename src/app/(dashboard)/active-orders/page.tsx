"use client";

import { useEffect, useState } from "react";
import { getActiveOrders } from "@/lib/actions/orders";
import { getUserPermissionsAction } from "@/lib/permissions-actions";
import { useSession } from "next-auth/react";
import { Loader2, Package, Search, Calendar, FileText, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function ActiveOrdersPage() {
    const { data: session } = useSession();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const searchParams = useSearchParams();
    const orgId = searchParams.get("orgId");

    useEffect(() => {
        async function loadOrders() {
            if (!session?.user?.id) return;

            try {
                // If orgId is not explicitly passed (e.g. from sidebar without param), try to derive it or get user's accessible orgs
                // For now, let's assume we want to show orders for ALL accessible orgs if no orgId is specified, or just the main one.
                // The sidebar logic usually appends orgId if it exists in URL.
                // If not, we might default to user.organizationId?
                // Let's fetch permissions/orgs first to be safe, similar to other pages.

                let targetOrgs: string[] = [];

                if (orgId) {
                    targetOrgs = [orgId];
                } else {
                    // Get all accessible orgs for the user
                    const permissions = await getUserPermissionsAction(session.user.id);
                    // This helper returns a specialized object, but maybe we can just get the user's org info from specific action?
                    // Or just use the getActiveOrders logic which might need refinement if no orgId is passed to it?
                    // Actually getActiveOrders takes an array.
                    // Let's try to get the user's current org context from another source if possible.
                    // For simplicity, if no org param, active orders might be empty or we fetch for user's main org.
                    // Let's rely on getActiveOrders to handle user validation if we pass user ID? No, it expects OrgIDs.

                    // Quick fix: Fetch user details to get orgs
                    // Ideally we should have a "getUserAccessibleOrgs" action.
                    // For now, let's assume the user context provides the updated session/org info?
                    // Actually, Sidebar handles orgId param well. If it's missing, let's try to fetch for user.organizationId if available in session? 
                    // Session usually has just basic info.

                    // Let's pass an empty array and let the backend (modified below) or just return empty for now?
                    // Better: modify the action to find orgs if none provided?
                    // Or here:
                    if (session.user.organizationId) {
                        targetOrgs = [session.user.organizationId];
                    }
                }

                if (targetOrgs.length > 0) {
                    const data = await getActiveOrders(targetOrgs);
                    setOrders(data);
                }
            } catch (error) {
                console.error("Failed to load active orders:", error);
            } finally {
                setLoading(false);
            }
        }

        loadOrders();
    }, [session, orgId]);

    const filteredOrders = orders.filter(order =>
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.organization?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <header className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Active Orders</h1>
                    <p className="text-slate-500 mt-1">Track orders currently being processed by our team.</p>
                </div>
            </header>

            {/* Search */}
            <div className="mb-6 relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search orders..."
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                </div>
            ) : filteredOrders.length === 0 ? (
                <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Package className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900">No active orders</h3>
                    <p className="text-slate-500 mt-2 max-w-sm mx-auto">
                        You don't have any orders currently in progress. Place a new order to get started.
                    </p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredOrders.map((order) => {
                        const isReturned = order.status === "RETURNED";
                        const isProcessing = order.status === "PROCESSING";
                        const statusColor = isReturned ? "bg-red-50 text-red-700 border-red-200" :
                            isProcessing ? "bg-blue-50 text-blue-700 border-blue-200" :
                                "bg-yellow-50 text-yellow-700 border-yellow-200"; // Pending

                        return (
                            <div key={order.id} className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4">
                                        <div className={`h-12 w-12 rounded-lg flex items-center justify-center flex-shrink-0 ${isReturned ? "bg-red-100" : "bg-blue-100"}`}>
                                            {isReturned ? <AlertCircle className="h-6 w-6 text-red-600" /> : <Clock className="h-6 w-6 text-blue-600" />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="font-bold text-slate-900 text-lg">{order.orderNumber}</h3>
                                                <Badge variant="outline" className={statusColor}>
                                                    {order.status}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-slate-500">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="h-4 w-4" />
                                                    <span>{format(new Date(order.createdAt), "MMM d, yyyy")}</span>
                                                </div>
                                                <span className="text-slate-300">•</span>
                                                <div className="flex items-center gap-1.5">
                                                    <FileText className="h-4 w-4" />
                                                    <span>{order.documents.length} Documents</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action (Mainly View Documents?) */}
                                    {/* For Active orders, maybe just show details or generic 'View' if we want to allow seeing uploads? */}
                                    {/* Usually Client can't edit active orders. */}
                                    {/* <button className="text-sm font-medium text-blue-600 hover:text-blue-800">View Details</button> */}
                                </div>

                                {/* Progress Bar / Steps if relevant? */}
                                {isReturned && (
                                    <div className="mt-4 p-3 bg-red-50 rounded-lg text-sm text-red-800 border border-red-100 flex items-start gap-2">
                                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                        <span>
                                            Some documents were returned. Please check the Review Orders page to address rejection reasons.
                                        </span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
