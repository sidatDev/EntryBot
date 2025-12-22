"use server";

import { prisma } from "@/lib/prisma";
import { History, ShieldAlert } from "lucide-react";

export async function getAuditLogs(organizationId: string) {
    return await prisma.auditLog.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: { user: { select: { name: true } } }
    });
}

export default async function AuditLogViewer({ organizationId }: { organizationId: string }) {
    const logs = await getAuditLogs(organizationId);

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-gray-200 flex items-center gap-3">
                <History className="text-gray-400" />
                <h3 className="text-lg font-bold text-gray-900">System Activity Log</h3>
            </div>

            <div className="max-h-[500px] overflow-y-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500 font-medium sticky top-0">
                        <tr>
                            <th className="px-6 py-3">Time</th>
                            <th className="px-6 py-3">User</th>
                            <th className="px-6 py-3">Action</th>
                            <th className="px-6 py-3">Resource</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {logs.map((log) => (
                            <tr key={log.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-gray-500 font-mono text-xs">
                                    {log.createdAt.toLocaleString()}
                                </td>
                                <td className="px-6 py-4 font-medium text-gray-900">
                                    {log.user?.name || "System"}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${log.action.includes("DELETE") ? "bg-red-100 text-red-800" :
                                        log.action.includes("CREATE") ? "bg-green-100 text-green-800" :
                                            "bg-blue-100 text-blue-800"
                                        }`}>
                                        {log.action}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-gray-600 max-w-xs truncate" title={JSON.stringify(log.details)}>
                                    {log.resourceId}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {logs.length === 0 && (
                    <div className="p-8 text-center text-gray-500">No activity recorded yet.</div>
                )}
            </div>
        </div>
    );
}
