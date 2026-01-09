import Link from "next/link";
import { Users, FileText, CheckCircle, Clock } from "lucide-react";

interface ManagerViewProps {
    teamMembers: any[];
}

export function ManagerView({ teamMembers }: ManagerViewProps) {


    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Users className="h-6 w-6 text-indigo-600" />
                Team Oversight
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teamMembers.map(member => {
                    // Logic to calculate active tasks would happen in backend usually.
                    // Assuming member.assignedDocs contains active docs.
                    const activeCount = member.assignedDocs?.length || 0;

                    return (
                        <div key={member.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                                    {member.name?.charAt(0) || "U"}
                                </div>
                                <div>
                                    <div className="font-bold text-slate-900">{member.name}</div>
                                    <div className="text-xs text-slate-500">{member.email}</div>
                                </div>
                                <div className={`ml-auto px-2 py-1 rounded text-xs font-medium ${member.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                    {member.status}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2 text-slate-600">
                                        <Clock className="h-4 w-4 text-amber-500" /> Current Queue
                                    </div>
                                    <span className="font-bold text-slate-900">{activeCount}</span>
                                </div>
                                {/* Mock Completed Today - Backend doesn't support yet, so leaving purely visual or 0 */}
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2 text-slate-600">
                                        <CheckCircle className="h-4 w-4 text-green-500" /> Completed Today
                                    </div>
                                    <span className="font-bold text-slate-900">-</span>
                                </div>
                            </div>

                            <Link
                                href={`/team/${member.id}`}
                                className="w-full mt-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors flex items-center justify-center"
                            >
                                View Assigned Documents
                            </Link>
                        </div>
                    );
                })}

                {teamMembers.length === 0 && (
                    <div className="col-span-full p-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
                        <Users className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                        <h3 className="text-slate-900 font-medium">No Team Members Found</h3>
                        <p className="text-slate-500 text-sm mt-1">Add users with role "Entry Operator" to see them here.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
