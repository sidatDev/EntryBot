import { getMyOrganizations } from "@/lib/actions/organization";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building, FileText, Upload, Play, Clock, CheckCircle } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CreateOrgModal } from "@/components/organizations/CreateOrgModal";
import { ClientUploadWrapper } from "@/components/dashboard/ClientUploadWrapper";

export default async function HubPage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const organizations = await getMyOrganizations();

    // Fetch aggregated stats for all owned organizations
    const orgIds = organizations.map(o => o.id);

    const docStats = await prisma.document.groupBy({
        by: ['organizationId', 'status'],
        where: {
            organizationId: { in: orgIds },
            status: { not: 'DELETED' }
        },
        _count: {
            id: true
        }
    });

    // Process stats
    let totalPending = 0;
    let totalProcessing = 0;
    let totalCompleted = 0;
    const orgStatsMap: Record<string, { pending: number }> = {};

    docStats.forEach(stat => {
        const count = stat._count.id;

        // Initialize map if needed
        if (!orgStatsMap[stat.organizationId || 'unassigned']) {
            orgStatsMap[stat.organizationId || 'unassigned'] = { pending: 0 };
        }

        // Aggregate Global Stats
        if (stat.status === 'UPLOADED' || stat.status === 'PENDING') {
            totalPending += count;
            // Org level pending
            if (stat.organizationId) {
                orgStatsMap[stat.organizationId].pending += count;
            }
        } else if (stat.status === 'PROCESSING') {
            totalProcessing += count;
        } else if (stat.status === 'COMPLETED') {
            totalCompleted += count;
        }
    });

    // Calculate Efficiency (Mock logic for now based on completion)
    const totalDocs = totalPending + totalProcessing + totalCompleted;
    const efficiencyRate = totalDocs > 0 ? Math.round((totalCompleted / totalDocs) * 100) : 100;

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">The Hub</h1>
                    <p className="text-gray-500 mt-2">Central Data Entry Command Center</p>
                </div>
                <CreateOrgModal />
            </div>

            {/* Quick Actions */}
            <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <Upload className="mr-2 h-5 w-5 text-gray-500" />
                    Quick Upload
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Invoice Upload */}
                    <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3 pt-5">
                            <CardTitle className="text-md font-medium text-slate-800 flex items-center gap-2">
                                <FileText className="h-5 w-5 text-indigo-500" />
                                Purchase Invoices
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="mb-4 text-xs text-slate-500">
                                Upload bills, receipts, and purchase orders.
                            </div>
                            <div className="w-full">
                                <ClientUploadWrapper category="GENERAL" label="Upload Invoices" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Bank Statement Upload */}
                    <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3 pt-5">
                            <CardTitle className="text-md font-medium text-slate-800 flex items-center gap-2">
                                <Building className="h-5 w-5 text-amber-500" />
                                Bank Statements
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="mb-4 text-xs text-slate-500">
                                Upload PDF or Excel bank/card statements.
                            </div>
                            <div className="w-full">
                                <ClientUploadWrapper category="STATEMENT" label="Upload Statements" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Other Documents Upload */}
                    <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3 pt-5">
                            <CardTitle className="text-md font-medium text-slate-800 flex items-center gap-2">
                                <Upload className="h-5 w-5 text-blue-500" />
                                Other Documents
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="mb-4 text-xs text-slate-500">
                                Upload Identity Cards and other docs.
                            </div>
                            <div className="w-full">
                                <ClientUploadWrapper category="OTHER" label="Upload Others" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Stats Row: Queue & Efficiency */}
            {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-medium text-gray-700">Your Queue</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-500 text-sm">Pending</span>
                            <span className="font-bold text-orange-600">{totalPending}</span>
                        </div>
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-gray-500 text-sm">Processing</span>
                            <span className="font-bold text-blue-600">{totalProcessing}</span>
                        </div>
                        <Button className="w-full" asChild>
                            <Link href="/documents?status=UPLOADED">
                                <Play className="mr-2 h-4 w-4" /> Start Processing
                            </Link>
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-medium text-gray-700">Efficiency</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-2">
                            <div className="text-3xl font-bold text-gray-900">{efficiencyRate}%</div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide mt-1">Completion Rate</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t">
                            <div className="text-center">
                                <div className="text-lg font-semibold">-</div>
                                <div className="text-[10px] text-gray-400">Avg Time</div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-semibold">{totalDocs}</div>
                                <div className="text-[10px] text-gray-400">Total</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div> */}

            {/* Client Selection / Active Workspaces */}
            <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <Building className="mr-2 h-5 w-5 text-gray-500" />
                    Active Client Workspaces
                </h2>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-600">Filter by:</span>
                            <select className="text-sm border-slate-200 rounded-md px-2 py-1 bg-white">
                                <option>All Statuses</option>
                                <option>Active</option>
                                <option>Trial</option>
                            </select>
                        </div>
                        <div className="text-sm text-slate-500">
                            Showing {organizations?.length || 0} clients
                        </div>
                    </div>

                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3">Client Name</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Credits</th>
                                <th className="px-6 py-3">Team</th>
                                <th className="px-6 py-3 text-right">Queue</th>
                                <th className="px-6 py-3 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {organizations?.map((org) => (
                                <tr key={org.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-slate-900">{org.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${org.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                                            org.status === 'TRIAL' ? 'bg-blue-100 text-blue-700' :
                                                'bg-yellow-100 text-yellow-700'
                                            }`}>
                                            {org.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5 font-mono text-slate-700">
                                            <Clock className="h-3 w-3 text-slate-400" />
                                            {org.credits}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500">
                                        {org.users?.length || 0} Members
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {(orgStatsMap[org.id]?.pending || 0) > 0 ? (
                                            <span className="inline-flex items-center px-2 py-1 rounded bg-orange-50 text-orange-700 text-xs font-medium">
                                                {orgStatsMap[org.id].pending} Pending
                                            </span>
                                        ) : (
                                            <span className="text-slate-400 text-xs">Empty</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Button asChild variant="outline" size="sm" className=" transition-opacity">
                                            <Link href={`/hub/${org.id}`}>
                                                Open Workspace <CheckCircle className="ml-1 h-3 w-3" />
                                            </Link>
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {(!organizations || organizations.length === 0) && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                        <Building className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                                        <p>No organizations found assigned to you.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div >
    );
}
