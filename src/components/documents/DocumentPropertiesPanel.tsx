"use client";

import { Document, Tag } from "@prisma/client";
import { useState, useTransition } from "react";
import { X, Plus, Save, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { addTag, removeTag, updateDocumentDetails } from "@/lib/actions";

type DocumentWithTags = Document & { tags: Tag[] };

interface DocumentPropertiesPanelProps {
    document: DocumentWithTags | null;
}

export function DocumentPropertiesPanel({ document }: DocumentPropertiesPanelProps) {
    const [isPending, startTransition] = useTransition();
    const [note, setNote] = useState("");
    const [newTag, setNewTag] = useState("");
    const [type, setType] = useState(document?.category === "STATEMENT" ? "Bank Statement"
        : document?.category === "GENERAL" ? "Invoice & Receipt"
            : "Other Document");

    // Sync state when selection changes
    if (document && !isPending) {
        // This is a simple (and slightly buggy) way to sync, usually better with useEffect
        // But for now, let's use useEffect in the component logic below or key-based reset
    }

    // Better: use key on component to reset state

    if (!document) {
        return (
            <div className="w-80 border-l border-slate-200 bg-white p-6 flex flex-col items-center justify-center text-slate-400">
                No document selected
            </div>
        );
    }

    const handleSave = () => {
        startTransition(async () => {
            await updateDocumentDetails(document.id, {
                // notes: note, // Removed as property doesn't exist on Document model
                type: type
            });
        });
    };

    const handleAddTag = () => {
        if (!newTag.trim()) return;
        startTransition(async () => {
            await addTag(document.id, newTag);
            setNewTag("");
        });
    };

    const handleRemoveTag = (tagId: string) => {
        startTransition(async () => {
            await removeTag(document.id, tagId);
        });
    };

    return (
        <div className="w-80 border-l border-slate-200 bg-white flex flex-col h-full overflow-y-auto">
            <div className="p-6 space-y-6">

                {/* Header */}
                <div>
                    <h3 className="text-lg font-semibold text-slate-800">Document Properties</h3>
                    <p className="text-xs text-slate-500">Manage metadata and tags</p>
                </div>

                {/* ID & Info (Read Only) */}
                <div className="space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <span className="text-slate-500">Document ID:</span>
                        <span className="font-mono text-slate-700 text-right">#{document.id.slice(-6)}</span>

                        <span className="text-slate-500">Status:</span>
                        <span className="text-slate-700 text-right font-medium">{document.status}</span>

                        <span className="text-slate-500">Uploaded:</span>
                        <span className="text-slate-700 text-right">{format(new Date(document.createdAt), "dd/MM/yy")}</span>
                    </div>
                </div>

                {/* Document Type */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Document Type</label>
                    <select
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        className="w-full p-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    >
                        <option>Other Document</option>
                        <option>Invoice & Receipt</option>
                        <option>Bank Statement</option>
                    </select>
                </div>

                {/* Tags */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Tags</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                        {document.tags.map(tag => (
                            <span key={tag.id} className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full text-xs font-medium border border-indigo-100">
                                {tag.name}
                                <button onClick={() => handleRemoveTag(tag.id)} className="hover:text-indigo-900 transition-colors">
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            placeholder="Add tag..."
                            className="flex-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                        />
                        <button
                            onClick={handleAddTag}
                            disabled={isPending}
                            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
                        >
                            <Plus className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Notes & Remarks</label>
                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={6}
                        className="w-full p-3 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                        placeholder="Enter internal notes or rejection remarks..."
                    />
                </div>

                {/* Save Button */}
                <button
                    onClick={handleSave}
                    disabled={isPending}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save Changes
                </button>

            </div>
        </div>
    );
}
