"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { RefreshCw, Search, Play } from "lucide-react";
import { getOperatorAnalytics } from "@/lib/operator-actions";

// Define interface matching the detailed analytics from backend
interface OrgAnalytics {
    id: string;
    name: string;
    entityName: string;
    status: string;
    remainingCredits: number;
    processingCredits: number;
    estimatedCredits: number;
    oldestDocTime?: Date;
    latestDocTime?: Date;
    elapsedTimeLogin?: Date | null;
    stats: {
        pendingInvoices: number;
        splittedInvoices: number;
        pendingStatements: number;
        splittedStatements: number;
        pendingDocuments: number;
        inProcess: number;
    };
}

export function OperatorOrgList({ view }: { view?: string }) {
    const router = useRouter();
    const [orgs, setOrgs] = useState<OrgAnalytics[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await getOperatorAnalytics();
                setOrgs(data);
            } catch (e) {
                console.error("Failed to load orgs", e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const handleOrgClick = (orgId: string) => {
        let query = "";
        if (view === "invoices") query = "?category=INVOICE"; // Matches "SALES_INVOICE", "PURCHASE_INVOICE" usually via includes
        else if (view === "statements") query = "?category=STATEMENT";
        else if (view === "other") query = "?category=OTHER";

        router.push(`/operator/${orgId}${query}`);
    };

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'active': return 'text-green-600';
            case 'cancelled': return 'text-red-500';
            case 'intrial': return 'text-blue-500';
            case 'non_renewing': return 'text-gray-500';
            default: return 'text-slate-600';
        }
    };

    const TimeCell = ({ date }: { date?: Date | null }) => {
        if (!date) return <span className="text-slate-300">-</span>;
        // Handle invalid dates
        const d = new Date(date);
        if (isNaN(d.getTime())) return <span className="text-slate-300">-</span>;
        return <span>{formatDistanceToNow(d, { addSuffix: true }).replace("about ", "")}</span>;
    };

    if (loading) return <div className="p-8 text-center text-gray-500 font-mono text-sm">Loading Entity List...</div>;

    return (
        <div className="p-4 bg-slate-50 min-h-screen font-sans">
            {/* Header Toolbar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600 rounded text-white">
                        <Play size={16} fill="currentColor" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800 tracking-tight">View All Entity List</h1>
                        <p className="text-xs text-slate-500">Here you can see all your entity list.</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 text-white text-xs font-semibold rounded hover:bg-slate-700 transition">
                        <Play size={12} /> Start Service
                    </button>
                    <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 text-white text-xs font-semibold rounded hover:bg-slate-700 transition">
                        All Entities
                    </button>
                    <button
                        onClick={() => window.location.reload()}
                        className="p-1.5 bg-slate-800 text-white rounded hover:bg-slate-700 transition"
                    >
                        <RefreshCw size={14} />
                    </button>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Table Search"
                            className="bg-white border border-slate-300 rounded pl-2 pr-8 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 outline-none w-40"
                        />
                        <Search className="absolute right-2 top-1.5 text-slate-400" size={14} />
                    </div>
                </div>
            </div>

            {/* Info Bar */}
            <div className="flex justify-end text-[10px] text-slate-500 mb-2 gap-4 font-medium">
                <span>Processing Time: Statements: 1 Hour, Invoices: 1 Hour</span>
            </div>

            {/* Main Table */}
            <div className="bg-white rounded border border-slate-200 shadow-sm overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="bg-[#0ea5e9] text-white font-semibold">
                        <tr>
                            <th className="px-4 py-3">Organization</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3 text-center">Remaining<br />Credits</th>
                            <th className="px-4 py-3 text-center">Processing<br />Credits</th>
                            <th className="px-4 py-3 text-center">Estimated<br />Credits</th>
                            <th className="px-4 py-3">Entity Name</th>
                            <th className="px-4 py-3">Oldest Doc<br />Elapsed Time</th>
                            <th className="px-4 py-3">Latest Doc<br />Elapsed Time</th>
                            <th className="px-4 py-3">Elapsed<br />Time Login</th>
                            <th className="px-2 py-3 text-center bg-[#0284c7]">Pending<br />Invoices</th>
                            <th className="px-2 py-3 text-center bg-[#0284c7]">Splitted<br />Invoices</th>
                            <th className="px-2 py-3 text-center bg-[#0284c7]">Pending<br />Statements</th>
                            <th className="px-2 py-3 text-center bg-[#0284c7]">Splitted<br />Statements</th>
                            <th className="px-2 py-3 text-center bg-[#0284c7]">Pending<br />Documents</th>
                            <th className="px-2 py-3 text-center bg-[#22c55e]">In Process</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {orgs.map((org, i) => (
                            <tr
                                key={org.id}
                                className={i % 2 === 0 ? "bg-white hover:bg-slate-50 cursor-pointer" : "bg-[#f0fdf4]/30 hover:bg-slate-50 cursor-pointer"}
                                onClick={() => handleOrgClick(org.id)}
                            >
                                <td className="px-4 py-3 text-indigo-600">{org.name}</td>
                                <td className={`px-4 py-3 font-bold ${getStatusColor(org.status)}`}>{org.status}</td>

                                {/* Credits */}
                                <td className="px-4 py-3 text-center">
                                    <span className="bg-red-600 text-white px-1.5 py-0.5 rounded text-[10px] font-bold">{org.remainingCredits}</span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <span className="bg-red-600 text-white px-1.5 py-0.5 rounded text-[10px] font-bold">{org.processingCredits}</span>
                                </td>
                                <td className="px-4 py-3 text-center font-bold text-slate-600">{org.estimatedCredits}</td>

                                <td className="px-4 py-3 text-slate-800">{org.entityName}</td>

                                {/* Timestamps */}
                                <td className="px-4 py-3 text-slate-600"><TimeCell date={org.oldestDocTime} /></td>
                                <td className="px-4 py-3 text-slate-600"><TimeCell date={org.latestDocTime} /></td>
                                <td className="px-4 py-3 text-slate-600"><TimeCell date={org.elapsedTimeLogin} /></td>

                                {/* Counts - Blue/Green Blocks */}
                                <td className="px-2 py-3 text-center">
                                    <div className="bg-[#3b82f6] text-white py-1 rounded w-full font-bold">{org.stats.pendingInvoices}</div>
                                </td>
                                <td className="px-2 py-3 text-center font-bold text-slate-500">
                                    {org.stats.splittedInvoices}
                                </td>
                                <td className="px-2 py-3 text-center">
                                    <div className="bg-[#86efac] text-slate-800 py-1 rounded w-full font-bold">{org.stats.pendingStatements}</div>
                                </td>
                                <td className="px-2 py-3 text-center font-bold text-slate-500">
                                    {org.stats.splittedStatements}
                                </td>
                                <td className="px-2 py-3 text-center font-bold text-slate-500">
                                    {org.stats.pendingDocuments}
                                </td>
                                <td className="px-2 py-3 text-center">
                                    <div className="bg-[#84cc16] text-white py-1 rounded w-full font-bold">{org.stats.inProcess}</div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {orgs.length === 0 && (
                    <div className="p-12 text-center text-slate-400">
                        No entities found.
                    </div>
                )}
            </div>
        </div>
    );
}
