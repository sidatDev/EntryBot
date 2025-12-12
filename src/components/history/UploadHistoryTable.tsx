"use client";

import { Document } from "@prisma/client";
import { format } from "date-fns";
import { Download, Eye, FileText, Filter, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type DocumentWithUser = Document & {
    user: {
        name: string | null;
        email: string;
    };
};

interface UploadHistoryTableProps {
    documents: DocumentWithUser[];
    pagination: {
        total: number;
        pages: number;
        current: number;
        limit: number;
    };
}

export function UploadHistoryTable({ documents, pagination }: UploadHistoryTableProps) {
    const [searchTerm, setSearchTerm] = useState("");

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {/* Action Bar */}
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by filename..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                        />
                    </div>
                    <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">
                        <Filter className="h-4 w-4" />
                        Filter
                    </button>
                    {/* Refresh logic would go here, maybe a router.refresh() */}
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500">
                        <tr>
                            <th className="px-6 py-4">Doc ID</th>
                            <th className="px-6 py-4">File Name</th>
                            <th className="px-6 py-4">Uploaded By</th>
                            <th className="px-6 py-4">Type</th>
                            <th className="px-6 py-4">Upload Date & Time</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Source</th>
                            <th className="px-6 py-4 text-right">Files</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {documents.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-6 py-8 text-center text-slate-400">
                                    No documents found.
                                </td>
                            </tr>
                        ) : (
                            documents.map((doc) => (
                                <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 font-mono text-xs">#{doc.id.slice(-6)}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-blue-500" />
                                            <span className="font-medium text-slate-900">{doc.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-slate-900">{doc.user.name || "Unknown"}</span>
                                            <span className="text-xs text-slate-400">{doc.user.email}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                                            {doc.category === "STATEMENT" ? "Statement" :
                                                doc.category === "SALES" ? "Invoice" :
                                                    doc.category === "PURCHASE" ? "Receipt" : "Other"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {format(new Date(doc.createdAt), "dd MMM yyyy HH:mm")}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${doc.status === "APPROVED" || doc.status === "COMPLETED" ? "bg-green-100 text-green-800" :
                                                doc.status === "PROCESSING" ? "bg-blue-100 text-blue-800" :
                                                    doc.status === "DELETED" ? "bg-red-100 text-red-800" :
                                                        "bg-gray-100 text-gray-800"
                                            }`}>
                                            {doc.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-xs">
                                        {doc.source || "WEB"}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link href={doc.url} target="_blank" className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View">
                                                <Eye className="h-4 w-4" />
                                            </Link>
                                            <Link href={doc.url} download className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Download">
                                                <Download className="h-4 w-4" />
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls could go here */}
            {pagination.pages > 1 && (
                <div className="p-4 border-t border-slate-200 flex items-center justify-between text-sm text-slate-500">
                    <span>Showing {((pagination.current - 1) * pagination.limit) + 1} to {Math.min(pagination.current * pagination.limit, pagination.total)} of {pagination.total} entries</span>
                    <div className="flex gap-2">
                        <button disabled={pagination.current === 1} className="px-3 py-1 border rounded hover:bg-slate-50 disabled:opacity-50">Previous</button>
                        <button disabled={pagination.current === pagination.pages} className="px-3 py-1 border rounded hover:bg-slate-50 disabled:opacity-50">Next</button>
                    </div>
                </div>
            )}
        </div>
    );
}
