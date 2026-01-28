"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Copy, FileText, CheckSquare, Square, Merge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mergeDocuments } from "@/lib/actions"; // We will add wrapper or use server action directly
import { toast } from "sonner";

interface Document {
    id: string;
    name: string;
    url: string;
    updatedAt: Date;
    status: string;
    uploaderId: string;
}

interface OperatorDocumentListProps {
    documents: Document[];
    selectedDocId: string | null;
    onSelectDoc: (doc: Document) => void;
    userId: string;
}

export function OperatorDocumentList({ documents, selectedDocId, onSelectDoc, userId }: OperatorDocumentListProps) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isMerging, setIsMerging] = useState(false);

    const toggleSelection = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    const handleMerge = async () => {
        if (selectedIds.size < 2) return;
        setIsMerging(true);
        try {
            await mergeDocuments(Array.from(selectedIds), userId);
            toast.success("Documents merged successfully");
            setSelectedIds(new Set());
        } catch (e) {
            toast.error("Failed to merge documents");
            console.error(e);
        } finally {
            setIsMerging(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white border-r border-slate-200">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <h3 className="font-semibold text-slate-700">Documents ({documents.length})</h3>
                {selectedIds.size > 1 && (
                    <Button
                        size="sm"
                        variant="default"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        onClick={handleMerge}
                        disabled={isMerging}
                    >
                        <Merge className="w-4 h-4 mr-2" />
                        Merge ({selectedIds.size})
                    </Button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto">
                {documents.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">No documents found</div>
                ) : (
                    <ul className="divide-y divide-slate-100">
                        {documents.map((doc) => {
                            const isSelected = selectedIds.has(doc.id);
                            const isActive = selectedDocId === doc.id;

                            return (
                                <li
                                    key={doc.id}
                                    onClick={() => onSelectDoc(doc)}
                                    className={`
                                        relative group p-4 hover:bg-slate-50 cursor-pointer transition-colors border-l-4
                                        ${isActive ? "bg-indigo-50 border-indigo-500" : "border-transparent"}
                                    `}
                                >
                                    <div className="flex items-start gap-3">
                                        <button
                                            onClick={(e) => toggleSelection(e, doc.id)}
                                            className="mt-1 text-slate-400 hover:text-indigo-600 transition-colors"
                                        >
                                            {isSelected ? (
                                                <CheckSquare className="w-5 h-5 text-indigo-600" />
                                            ) : (
                                                <Square className="w-5 h-5" />
                                            )}
                                        </button>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="text-sm font-medium text-slate-900 truncate pr-2">
                                                    {doc.name}
                                                </p>
                                                <span className="text-[10px] text-slate-400 whitespace-nowrap">
                                                    {format(new Date(doc.updatedAt), "MMM d, HH:mm")}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${doc.status === 'UPLOADED' ? 'bg-blue-100 text-blue-700' :
                                                        doc.status === 'PROCESSING' ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-green-100 text-green-700'
                                                    }`}>
                                                    {doc.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
}
