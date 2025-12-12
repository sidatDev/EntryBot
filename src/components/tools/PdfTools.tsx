"use client";

import { useState } from "react";
import { Files, Split, Loader2 } from "lucide-react";
import { mergeDocuments, splitDocument } from "@/lib/actions";
import { useSession } from "next-auth/react";

interface PdfToolsProps {
    selectedIds: string[];
    onComplete: () => void;
}

export function PdfTools({ selectedIds, onComplete }: PdfToolsProps) {
    const { data: session } = useSession();
    const [loading, setLoading] = useState(false);

    const handleMerge = async () => {
        if (!session?.user || selectedIds.length < 2) return;
        setLoading(true);
        try {
            await mergeDocuments(selectedIds, (session.user as any).id);
            onComplete();
        } catch (error) {
            console.error("Merge failed", error);
            alert("Failed to merge documents");
        } finally {
            setLoading(false);
        }
    };

    const handleSplit = async () => {
        if (selectedIds.length !== 1) return;
        setLoading(true);
        try {
            await splitDocument(selectedIds[0]);
            onComplete();
        } catch (error) {
            console.error("Split failed", error);
            alert("Failed to split document");
        } finally {
            setLoading(false);
        }
    };

    if (selectedIds.length === 0) return null;

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-4 z-50 animate-in fade-in slide-in-from-bottom-4">
            <span className="text-sm font-medium">{selectedIds.length} selected</span>
            <div className="h-4 w-px bg-slate-700" />

            <button
                onClick={handleMerge}
                disabled={selectedIds.length < 2 || loading}
                className="flex items-center gap-2 hover:text-indigo-400 disabled:opacity-50 disabled:hover:text-white transition-colors text-sm font-medium"
            >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Files className="h-4 w-4" />}
                Merge
            </button>

            <button
                onClick={handleSplit}
                disabled={selectedIds.length !== 1 || loading}
                className="flex items-center gap-2 hover:text-indigo-400 disabled:opacity-50 disabled:hover:text-white transition-colors text-sm font-medium"
            >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Split className="h-4 w-4" />}
                Split
            </button>
        </div>
    );
}
