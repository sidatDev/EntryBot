"use client";

import { useState } from "react";
import { DocumentList } from "@/components/documents/DocumentList";
import { assignDocumentToMe } from "@/lib/actions";
import { RefreshCw, Play } from "lucide-react";

interface OperatorViewProps {
    unclaimedDocs: any[];
    myQueueDocs: any[];
    completedDocs: any[];
    currentUser: any;
}

export function OperatorView({ unclaimedDocs, myQueueDocs, completedDocs, currentUser }: OperatorViewProps) {
    const [activeTab, setActiveTab] = useState<"pool" | "queue" | "completed">("pool");

    return (
        <div className="space-y-6">
            {/* Header / Stats */}
            <div className="grid grid-cols-3 gap-4">
                <button
                    onClick={() => setActiveTab("pool")}
                    className={`p-4 rounded-xl border text-left transition-all ${activeTab === "pool" ? "bg-indigo-50 border-indigo-200 ring-2 ring-indigo-500/20" : "bg-white border-slate-200 hover:border-indigo-200"}`}
                >
                    <div className="text-sm text-slate-500 font-medium">Unclaimed Pool</div>
                    <div className="text-2xl font-bold text-slate-800">{unclaimedDocs.length}</div>
                    <div className="text-xs text-indigo-600 mt-1 font-medium">Action Required</div>
                </button>

                <button
                    onClick={() => setActiveTab("queue")}
                    className={`p-4 rounded-xl border text-left transition-all ${activeTab === "queue" ? "bg-blue-50 border-blue-200 ring-2 ring-blue-500/20" : "bg-white border-slate-200 hover:border-blue-200"}`}
                >
                    <div className="text-sm text-slate-500 font-medium">My Queue</div>
                    <div className="text-2xl font-bold text-slate-800">{myQueueDocs.length}</div>
                    <div className="text-xs text-blue-600 mt-1 font-medium">In Progress</div>
                </button>

                <button
                    onClick={() => setActiveTab("completed")}
                    className={`p-4 rounded-xl border text-left transition-all ${activeTab === "completed" ? "bg-green-50 border-green-200 ring-2 ring-green-500/20" : "bg-white border-slate-200 hover:border-green-200"}`}
                >
                    <div className="text-sm text-slate-500 font-medium">Completed Today</div>
                    <div className="text-2xl font-bold text-slate-800">{completedDocs.length}</div>
                    <div className="text-xs text-green-600 mt-1 font-medium">Good Job!</div>
                </button>
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-bold text-slate-800">
                        {activeTab === "pool" && "Unclaimed Documents (Click to Claim)"}
                        {activeTab === "queue" && "Your Active Queue"}
                        {activeTab === "completed" && "Completed History"}
                    </h2>
                    <button onClick={() => window.location.reload()} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-indigo-600 transition-colors">
                        <RefreshCw className="h-4 w-4" />
                    </button>
                </div>

                {activeTab === "pool" && (
                    <div className="space-y-4">
                        <p className="text-sm text-slate-500 bg-amber-50 p-3 rounded-lg border border-amber-100">
                            📢 These documents are waiting to be processed. Click "Claim" to move them to your queue.
                        </p>
                        {/* 
                            We reuse DocumentList but need to inject a "Claim" action. 
                            Currently DocumentList is generic. 
                            For now, we can render a Custom List or pass a prop to DocumentList.
                            Let's use a Custom List for the Pool to show the Claim button prominently.
                        */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                                    <tr>
                                        <th className="px-4 py-3">Document</th>
                                        <th className="px-4 py-3">Type</th>
                                        <th className="px-4 py-3">Uploaded</th>
                                        <th className="px-4 py-3 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {unclaimedDocs.map(doc => (
                                        <tr key={doc.id} className="hover:bg-slate-50">
                                            <td className="px-4 py-3 font-medium text-slate-900">{doc.name}</td>
                                            <td className="px-4 py-3 text-slate-500">{doc.category}</td>
                                            <td className="px-4 py-3 text-slate-500">{new Date(doc.createdAt).toLocaleDateString()}</td>
                                            <td className="px-4 py-3 text-right">
                                                <form action={async () => {
                                                    await assignDocumentToMe(doc.id);
                                                    // In real app, we might want optimistic update or toast
                                                }}>
                                                    <button type="submit" className="px-3 py-1.5 bg-indigo-600 text-white rounded text-xs font-medium hover:bg-indigo-700 shadow-sm flex items-center gap-1 ml-auto">
                                                        <Play className="h-3 w-3" /> Claim
                                                    </button>
                                                </form>
                                            </td>
                                        </tr>
                                    ))}
                                    {unclaimedDocs.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                                                No unclaimed documents available. Good job!
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === "queue" && (
                    <DocumentList documents={myQueueDocs} currentUser={currentUser} />
                )}

                {activeTab === "completed" && (
                    <DocumentList documents={completedDocs} currentUser={currentUser} />
                )}
            </div>
        </div>
    );
}
