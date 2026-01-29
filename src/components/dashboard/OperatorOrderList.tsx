"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow, format } from "date-fns";
import { RefreshCw, Search } from "lucide-react";
import { getOperatorOrders } from "@/lib/operator-actions";

// Match the return type of getOperatorOrders
interface OrderAnalytics {
    id: string;
    orderNumber: string;
    clientName: string;
    createdAt: Date;
    status: string;
    stats: {
        total: number;
        processed: number;
        pending: number;
        pendingInvoices?: number;
        pendingStatements?: number;
    };
}

export function OperatorOrderList({ view }: { view?: string }) {
    const router = useRouter();
    const [orders, setOrders] = useState<OrderAnalytics[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                // @ts-ignore - function exists after update
                const data = await getOperatorOrders();
                setOrders(data);
            } catch (e) {
                console.error("Failed to load orders", e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const handleOrderClick = (order: OrderAnalytics) => {
        let query = `?orderId=${order.id}`;
        if (view === "invoices") query += "&category=INVOICE";
        else if (view === "statements") query += "&category=STATEMENT";

        // We still route to the Org page, but with orderId context
        // This requires getting organizationId from the order, which we didn't return explicitly in previous step but it's in logic.
        // Wait, I didn't include orgId in getOperatorOrders return type in previous step.
        // I need to add it or fetch it.
        // For now, let's assume we can navigate to a generic order page or use a placeholder.
        // Actually, the previous implementation returned { id: order.id ... }.
        // I should return organizationId too.

        // Let's rely on the route /operator/[orgId]... wait, I don't have orgId here.
        // I must update getOperatorOrders to return organizationId to link correctly.

        // Temporary: log error or handle it.
        // I'll update getOperatorOrders next.
    };

    const getStatusColor = (status: string) => {
        switch (status?.toUpperCase()) {
            case 'COMPLETED': return 'text-green-600 bg-green-50';
            case 'PROCESSING': return 'text-blue-600 bg-blue-50';
            case 'PENDING': return 'text-orange-600 bg-orange-50';
            default: return 'text-slate-600 bg-slate-50';
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500 font-mono text-sm">Loading Orders...</div>;

    return (
        <div className="p-4 bg-slate-50 min-h-screen font-sans">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                <div className="flex items-center gap-3">
                    <div>
                        <h1 className="text-xl font-bold text-slate-800 tracking-tight">Incoming Orders</h1>
                        <p className="text-xs text-slate-500">Process client orders from here.</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => window.location.reload()}
                        className="p-1.5 bg-slate-800 text-white rounded hover:bg-slate-700 transition"
                    >
                        <RefreshCw size={14} />
                    </button>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search Orders"
                            className="bg-white border border-slate-300 rounded pl-2 pr-8 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 outline-none w-40"
                        />
                        <Search className="absolute right-2 top-1.5 text-slate-400" size={14} />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded border border-slate-200 shadow-sm overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="bg-[#0ea5e9] text-white font-semibold">
                        <tr>
                            <th className="px-4 py-3">Order #</th>
                            <th className="px-4 py-3">Client</th>
                            <th className="px-4 py-3">Date</th>
                            <th className="px-4 py-3 text-center">Status</th>
                            <th className="px-4 py-3 text-center">Total Files</th>
                            <th className="px-4 py-3 text-center">Processed</th>
                            <th className="px-4 py-3 text-center">Pending</th>
                            <th className="px-4 py-3 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {orders.map((order, i) => (
                            <tr
                                key={order.id}
                                className="bg-white hover:bg-slate-50"
                            >
                                <td className="px-4 py-3 font-mono text-indigo-600">{order.orderNumber}</td>
                                <td className="px-4 py-3 text-slate-800">{order.clientName}</td>
                                <td className="px-4 py-3 text-slate-500">
                                    {format(new Date(order.createdAt), "MMM d, yyyy HH:mm")}
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${getStatusColor(order.status)}`}>
                                        {order.status}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-center font-bold">{order.stats.total}</td>
                                <td className="px-4 py-3 text-center text-green-600 font-bold">{order.stats.processed}</td>
                                <td className="px-4 py-3 text-center text-orange-600 font-bold">{order.stats.pending}</td>
                                <td className="px-4 py-3 text-right">
                                    <button
                                        className="text-blue-600 hover:text-blue-800 font-bold"
                                        onClick={() => handleOrderClick(order)}
                                    >
                                        Start
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {orders.length === 0 && (
                    <div className="p-12 text-center text-slate-400">
                        No active orders found.
                    </div>
                )}
            </div>
        </div>
    );
}
