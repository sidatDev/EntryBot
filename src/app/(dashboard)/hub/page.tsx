import { getOrganizations } from "@/lib/actions/organization";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building, FileText, Upload, Play, Clock, CheckCircle } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

async function getStats(orgId?: string, userId?: string) {
    const where: any = {};
    if (orgId) where.organizationId = orgId;
    if (userId) where.assignedToId = userId;

    return {
        pending: await prisma.document.count({ where: { ...where, status: "UPLOADED" } }),
        processing: await prisma.document.count({ where: { ...where, status: "PROCESSING" } }),
        completed: await prisma.document.count({ where: { ...where, status: "COMPLETED" } }),
    };
}

export default async function HubPage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const { data: organizations } = await getOrganizations();
    // In a real scenario, we'd probably persist the "selected" organization in a cookie or URL param
    // For V1, we list them or show a "Select Client to Begin" view.

    // Let's make a grid of clients for quick access + specific "Work Queue" view.

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">The Hub</h1>
                <p className="text-gray-500 mt-2">Central Data Entry Command Center</p>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none shadow-lg">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center text-lg font-medium opacity-90">
                            <Upload className="mr-2 h-5 w-5" />
                            Quick Upload
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-indigo-100 text-sm mb-4">Upload new documents for processing immediately.</p>
                        <Button variant="secondary" className="w-full bg-white text-indigo-600 hover:bg-auth-50">
                            Select File
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-medium text-gray-700">Your Queue</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-500 text-sm">Pending</span>
                            <span className="font-bold text-orange-600">12</span>
                        </div>
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-gray-500 text-sm">Drafts</span>
                            <span className="font-bold text-blue-600">5</span>
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
                            <div className="text-3xl font-bold text-gray-900">98%</div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide mt-1">Accuracy Rate</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t">
                            <div className="text-center">
                                <div className="text-lg font-semibold">4m</div>
                                <div className="text-[10px] text-gray-400">Avg Time</div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-semibold">142</div>
                                <div className="text-[10px] text-gray-400">Docs Today</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

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
                            <select className="text-sm border-slate-200 rounded-md px-2 py-1 bg-white">
                                <option>All Teams</option>
                                <option>Team A</option>
                                <option>Team B</option>
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
                                            <span className="text-xs text-slate-500 font-mono">{org.type.replace('_', ' ')}</span>
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
                                        - {/* Team column placeholder until Team model exists */}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="inline-flex items-center px-2 py-1 rounded bg-orange-50 text-orange-700 text-xs font-medium">
                                            3 Pending
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Button asChild variant="outline" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
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
        </div>
    );
}
