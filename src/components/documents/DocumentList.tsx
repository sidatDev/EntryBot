"use client";

import { useState } from "react";
import { FileText, Calendar, ArrowRight, CheckSquare, Square } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { PdfTools } from "@/components/tools/PdfTools";
import { useRouter } from "next/navigation";

interface DocumentListProps {
    documents: any[];
}

export function DocumentList({ documents }: DocumentListProps) {
    const router = useRouter();
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const toggleSelection = (id: string) => {
        setSelectedIds((prev) =>
            prev.includes(id)
                ? prev.filter((i) => i !== id)
                : [...prev, id]
        );
    };

    const handleToolsComplete = () => {
        setSelectedIds([]);
        router.refresh();
    };

    return (
        <>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-slate-700 w-12">
                                    <span className="sr-only">Select</span>
                                </th>
                                <th className="px-6 py-4 font-semibold text-slate-700">Document</th>
                                <th className="px-6 py-4 font-semibold text-slate-700">Status</th>
                                <th className="px-6 py-4 font-semibold text-slate-700">Invoices</th>
                                <th className="px-6 py-4 font-semibold text-slate-700">Uploaded</th>
                                <th className="px-6 py-4 font-semibold text-slate-700 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {documents.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                        No documents found. Upload some to get started.
                                    </td>
                                </tr>
                            ) : (
                                documents.map((doc) => {
                                    const isSelected = selectedIds.includes(doc.id);
                                    return (
                                        <tr key={doc.id} className={cn("transition-colors", isSelected ? "bg-indigo-50/50" : "hover:bg-slate-50/50")}>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => toggleSelection(doc.id)}
                                                    className="text-slate-400 hover:text-indigo-600 transition-colors"
                                                >
                                                    {isSelected ? (
                                                        <CheckSquare className="h-5 w-5 text-indigo-600" />
                                                    ) : (
                                                        <Square className="h-5 w-5" />
                                                    )}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                                                        <FileText className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-slate-900">{doc.name}</p>
                                                        <p className="text-xs text-slate-500">
                                                            {(doc.size / 1024 / 1024).toFixed(2)} MB • {doc.type}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={cn(
                                                        "px-2.5 py-1 rounded-full text-xs font-medium",
                                                        doc.status === "COMPLETED"
                                                            ? "bg-emerald-100 text-emerald-700"
                                                            : doc.status === "PROCESSING"
                                                                ? "bg-amber-100 text-amber-700"
                                                                : "bg-slate-100 text-slate-700"
                                                    )}
                                                >
                                                    {doc.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5">
                                                    <FileText className="h-3.5 w-3.5 text-slate-400" />
                                                    <span className="text-slate-600 font-medium">
                                                        {doc._count.invoices}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-3 w-3" />
                                                    {new Date(doc.createdAt).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Link
                                                    href={`/documents/${doc.id}/process`}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors font-medium text-xs"
                                                >
                                                    Process
                                                    <ArrowRight className="h-3 w-3" />
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <PdfTools selectedIds={selectedIds} onComplete={handleToolsComplete} />
        </>
    );
}
