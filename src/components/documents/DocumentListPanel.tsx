"use client";

import { Document, Tag } from "@prisma/client";
import { Search, FileText, Image as ImageIcon } from "lucide-react";
import { format } from "date-fns";

type DocumentWithTags = Document & { tags: Tag[] };

interface DocumentListPanelProps {
    documents: DocumentWithTags[];
    selectedId: string | null;
    onSelect: (id: string) => void;
}

export function DocumentListPanel({ documents, selectedId, onSelect }: DocumentListPanelProps) {
    return (
        <div className="flex flex-col h-full bg-white border-r border-slate-200 w-80">
            {/* Header */}
            <div className="p-4 border-b border-slate-200">
                <h3 className="font-semibold text-slate-800">Documents</h3>
                <div className="mt-3 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
                {documents.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-sm">
                        There is no document in this folder.
                    </div>
                ) : (
                    <ul className="divide-y divide-slate-100">
                        {documents.map((doc) => (
                            <li
                                key={doc.id}
                                onClick={() => onSelect(doc.id)}
                                className={`cursor-pointer p-4 hover:bg-slate-50 transition-colors ${selectedId === doc.id ? "bg-indigo-50 hover:bg-indigo-50 border-l-4 border-indigo-500" : "border-l-4 border-transparent"}`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`mt-1 p-2 rounded-lg ${selectedId === doc.id ? "bg-white text-indigo-600 shadow-sm" : "bg-slate-100 text-slate-500"}`}>
                                        {doc.type === 'PDF' ? <FileText className="h-5 w-5" /> : <ImageIcon className="h-5 w-5" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-900 truncate">{doc.name}</p>
                                        <p className="text-xs text-slate-500 mt-0.5 truncate">#{doc.id.slice(-6)}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                                                {format(new Date(doc.createdAt), "dd MMM yyyy")}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
