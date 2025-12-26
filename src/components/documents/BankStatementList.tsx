"use client";

import { Document } from "@prisma/client";
import { format } from "date-fns";
import {
    FileText,
    MoreHorizontal,
    Eye,
    Download,
    Trash2,
    Edit,
    CheckCircle,
    CreditCard,
    Plus,
    RefreshCw,
    Filter,
    Columns,
    Search
} from "lucide-react";
import { Button } from "@/components/ui/button"; // Assuming standard UI button
import Link from "next/link";
import { UploadModal } from "@/components/upload/UploadModal";

interface BankStatementListProps {
    documents: any[];
    isRecycleBin?: boolean;
}

export function BankStatementList({ documents, isRecycleBin = false }: BankStatementListProps) {
    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col min-h-[600px]">
            {/* Action Bar */}
            <div className="p-4 border-b border-slate-100 space-y-4">
                {/* Row 1: High Level Actions & Search */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <UploadModal category="STATEMENT" />
                        <button className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                            <Plus className="h-4 w-4" />
                            Add Payment Method
                        </button>
                    </div>
                </div>

                {/* Row 2: Bulk & Filters */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <button className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                            Bulk Download
                        </button>
                        <button className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                            Bulk Edit
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search statements..."
                                className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
                            />
                        </div>
                        <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg border border-slate-200">
                            <RefreshCw className="h-4 w-4" />
                        </button>
                        <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg border border-slate-200">
                            <Filter className="h-4 w-4" />
                        </button>
                        <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg border border-slate-200">
                            <Columns className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                        <tr>
                            <th className="p-4 w-10">
                                <input type="checkbox" className="rounded border-slate-300" />
                            </th>
                            <th className="p-4 w-10"></th>
                            <th className="p-4">Doc ID</th>
                            <th className="p-4">Doc Type</th>
                            <th className="p-4">Display Name</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Last 4 Digits</th>
                            <th className="p-4">Account Info</th>
                            <th className="p-4">Currency</th>
                            <th className="p-4">Start Date</th>
                            <th className="p-4">End Date</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {documents.length === 0 ? (
                            <tr>
                                <td colSpan={12} className="p-8 text-center text-slate-400">
                                    No statements found. Upload one to get started.
                                </td>
                            </tr>
                        ) : (
                            documents.map((doc) => (
                                <tr key={doc.id} className="hover:bg-slate-50 group transition-colors">
                                    <td className="p-4">
                                        <input type="checkbox" className="rounded border-slate-300" />
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="text-slate-400 hover:text-indigo-600 p-1" title="View">
                                                <Eye className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                    <td className="p-4 font-mono text-xs text-slate-500">#{doc.id.slice(-6)}</td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <CreditCard className="h-4 w-4 text-slate-400" />
                                            <span>{doc.bankStatement?.statementType || "Bank Statement"}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 font-medium text-slate-800">
                                        {doc.bankStatement?.displayName || doc.name}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${doc.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : doc.status === 'PROCESSING' ? 'bg-amber-100 text-amber-700' : doc.status === 'UPLOADED' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                                            {doc.status}
                                        </span>
                                    </td>
                                    <td className="p-4">{doc.bankStatement?.last4Digits || "—"}</td>
                                    <td className="p-4">{doc.bankStatement?.accountInfo || "—"}</td>
                                    <td className="p-4">{doc.bankStatement?.currency || "GBP"}</td>
                                    <td className="p-4">
                                        {doc.bankStatement?.startDate ? format(new Date(doc.bankStatement.startDate), "dd MMM yyyy") : "—"}
                                    </td>
                                    <td className="p-4">
                                        {doc.bankStatement?.endDate ? format(new Date(doc.bankStatement.endDate), "dd MMM yyyy") : "—"}
                                    </td>
                                    <td className="p-4 text-right">
                                        <Link
                                            href={`/documents/${doc.id}/process`}
                                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded text-xs font-semibold transition-colors"
                                        >
                                            <Edit className="h-3 w-3" /> Process
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination (Stub for now, reusing design) */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between">
                <div className="text-sm text-slate-500">
                    Showing <span className="font-medium">{documents.length}</span> of <span className="font-medium">{documents.length}</span>
                </div>
                <div className="flex gap-2">
                    <button className="px-3 py-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50" disabled>Previous</button>
                    <button className="px-3 py-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50" disabled>Next</button>
                </div>
            </div>
        </div>
    );
}
