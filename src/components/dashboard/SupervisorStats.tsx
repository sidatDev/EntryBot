"use client";

import { useEffect, useState } from "react";
import { getTeamPerformance } from "@/lib/actions/analytics";
import { BarChart, Activity, AlertTriangle, Trophy } from "lucide-react";

export default function SupervisorStats({ organizationId }: { organizationId: string }) {
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        getTeamPerformance(organizationId).then(setStats);
    }, [organizationId]);

    if (!stats) return <div className="p-4 bg-gray-50 rounded-lg animate-pulse h-32"></div>;

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Activity className="text-blue-600" size={20} />
                Team Performance (Today)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm text-gray-500">Docs Processed</p>
                            <h4 className="text-2xl font-bold text-gray-900">{stats.processedToday}</h4>
                        </div>
                        <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                            <BarChart size={20} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm text-gray-500">QA Error Rate</p>
                            <h4 className={`text-2xl font-bold ${stats.errorRate > 5 ? 'text-red-600' : 'text-gray-900'}`}>
                                {stats.errorRate.toFixed(1)}%
                            </h4>
                        </div>
                        <div className={`p-2 rounded-lg ${stats.errorRate > 5 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                            <AlertTriangle size={20} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm col-span-1 md:col-span-1">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="p-1 bg-yellow-100 text-yellow-600 rounded">
                            <Trophy size={16} />
                        </div>
                        <span className="text-sm font-medium text-gray-900">Top Performer</span>
                    </div>
                    {stats.leaderboard[0] ? (
                        <div>
                            <div className="font-bold text-lg">{stats.leaderboard[0].name}</div>
                            <div className="text-sm text-gray-500">{stats.leaderboard[0].count} docs</div>
                        </div>
                    ) : (
                        <div className="text-sm text-gray-400">No data today</div>
                    )}
                </div>
            </div>
        </div>
    );
}
