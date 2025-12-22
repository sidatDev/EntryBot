"use client";

import { useEffect, useState } from "react";
import { getChildOrganizations } from "@/lib/actions/organization";
import { BarChart3, Users, Building, ArrowUpRight } from "lucide-react";
import Link from "next/link";

// Placeholder for data fetching - in real app, we'd have a specific action for Master Client Stats
// For now, we'll list sub-accounts and simple aggregate stats.

export default function MasterClientView({ organizationId }: { organizationId: string }) {
    const [subAccounts, setSubAccounts] = useState<any[]>([]);

    useEffect(() => {
        // Fetch sub-accounts
        // Assuming getOrganizationList serves this purpose or we need a specific one
        // For MVP, we'll use a placeholder or assume the generic one works if modified
    }, [organizationId]);

    // Mock Data for MVP visualization
    const stats = {
        totalSubAccounts: 12,
        totalSpend: 4500,
        activeDocs: 145,
        growth: "+12%"
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Sub-Accounts</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-2">{stats.totalSubAccounts}</h3>
                        </div>
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <Building size={20} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Monthly Spend</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-2">${stats.totalSpend.toLocaleString()}</h3>
                        </div>
                        <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                            <BarChart3 size={20} />
                        </div>
                    </div>
                </div>

                {/* More cards... */}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-900">Sub-Account Performance</h3>
                    <Link href="/hub" className="text-blue-600 text-sm hover:underline">View All</Link>
                </div>
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500 font-medium">
                        <tr>
                            <th className="px-6 py-3">Client Name</th>
                            <th className="px-6 py-3">Plan</th>
                            <th className="px-6 py-3">Docs (Mtd)</th>
                            <th className="px-6 py-3">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        <tr>
                            <td className="px-6 py-4 font-medium text-gray-900">Acme Branch A</td>
                            <td className="px-6 py-4">Silver</td>
                            <td className="px-6 py-4">120</td>
                            <td className="px-6 py-4"><span className="text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-medium">Active</span></td>
                        </tr>
                        <tr>
                            <td className="px-6 py-4 font-medium text-gray-900">Acme Branch B</td>
                            <td className="px-6 py-4">Bronze</td>
                            <td className="px-6 py-4">45</td>
                            <td className="px-6 py-4"><span className="text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full text-xs font-medium">Trial</span></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
