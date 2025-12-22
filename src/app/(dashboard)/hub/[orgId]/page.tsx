import { getOrganizations } from '@/lib/actions/organization';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Upload, FileText, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function ClientWorkspacePage({ params }: { params: { orgId: string } }) {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const org = await prisma.organization.findUnique({
        where: { id: params.orgId },
        include: {
            _count: {
                select: { documents: true }
            }
        }
    });

    if (!org) notFound();

    // Stats for this specific org
    const stats = {
        pending: await prisma.document.count({ where: { organizationId: org.id, status: "UPLOADED" } }),
        processing: await prisma.document.count({ where: { organizationId: org.id, status: "PROCESSING" } }),
        completed: await prisma.document.count({ where: { organizationId: org.id, status: "COMPLETED" } }),
        issues: await prisma.document.count({ where: { organizationId: org.id, status: "ERROR" } }),
    };

    return (
        <div className="space-y-6">
            {/* Header / Nav */}
            <div className="flex items-center gap-4 border-b pb-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/hub">
                        <ArrowLeft className="h-5 w-5 text-gray-500" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{org.name} <span className="text-gray-400 font-normal">Workspace</span></h1>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span className={`px-2 py-0.5 rounded textxs font-medium ${org.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {org.status}
                        </span>
                        <span>•</span>
                        <span>Credits: {org.credits}</span>
                    </div>
                </div>
                <div className="ml-auto flex gap-3">
                    <Button asChild className="bg-indigo-600 hover:bg-indigo-700">
                        <Link href={`/documents/upload?orgId=${org.id}`}>
                            <Upload className="mr-2 h-4 w-4" /> Upload Documents
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border shadow-sm flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                        <Clock className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold">{stats.pending}</div>
                        <div className="text-xs text-gray-500">Pending Review</div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border shadow-sm flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        <FileText className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold">{stats.processing}</div>
                        <div className="text-xs text-gray-500">Processing</div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border shadow-sm flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                        <AlertCircle className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold">{stats.issues}</div>
                        <div className="text-xs text-gray-500">Needs Attention</div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border shadow-sm flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                        <CheckCircle className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold">{stats.completed}</div>
                        <div className="text-xs text-gray-500">Completed</div>
                    </div>
                </div>
            </div>

            {/* Main Content Area - Tabs or Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Immediate Queue */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">Immediate Action Queue</h3>
                        <Link href={`/documents?orgId=${org.id}&status=UPLOADED`} className="text-sm text-blue-600 hover:underline">View All</Link>
                    </div>

                    {/* Placeholder for Document List Component */}
                    <div className="bg-white rounded-xl border shadow-sm min-h-[300px] flex items-center justify-center text-gray-400">
                        {stats.pending > 0 ? (
                            <p>Document List Component Here (Filtered by Org)</p>
                        ) : (
                            <div className="text-center">
                                <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-100" />
                                <p>All caught up! No pending documents.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Activity Feed / Notes */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">Recent Activity</h3>
                    <div className="bg-white rounded-xl border shadow-sm p-4 h-[300px]">
                        <p className="text-sm text-gray-500 italic">No recent activity recorded.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
