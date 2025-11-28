import { prisma } from "@/lib/prisma";
import { FileText, CheckCircle, Clock } from "lucide-react";

export default async function DashboardPage() {
    const stats = {
        total: await prisma.document.count(),
        completed: await prisma.document.count({ where: { status: "COMPLETED" } }),
        processing: await prisma.document.count({ where: { status: "PROCESSING" } }),
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
                <p className="text-slate-500">Overview of your document processing</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-6 rounded-xl border border-indigo-100 bg-indigo-50/50">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                            <FileText className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-indigo-600">Total Documents</p>
                            <h3 className="text-2xl font-bold text-slate-800">{stats.total}</h3>
                        </div>
                    </div>
                </div>

                <div className="glass-card p-6 rounded-xl border border-amber-100 bg-amber-50/50">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600">
                            <Clock className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-amber-600">Processing</p>
                            <h3 className="text-2xl font-bold text-slate-800">{stats.processing}</h3>
                        </div>
                    </div>
                </div>

                <div className="glass-card p-6 rounded-xl border border-emerald-100 bg-emerald-50/50">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
                            <CheckCircle className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-emerald-600">Completed</p>
                            <h3 className="text-2xl font-bold text-slate-800">{stats.completed}</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Activity Placeholder */}
            <div className="glass-card rounded-xl p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Recent Activity</h3>
                <div className="text-center py-12 text-slate-400">
                    No recent activity to show
                </div>
            </div>
        </div>
    );
}
