"use client";

import { useState } from "react";
import { Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";
import { splitDocument } from "@/lib/actions"; // Wrapper needed?
import { toast } from "sonner";

interface FileViewerProps {
    url: string | null;
    documentId: string | null;
    readOnly?: boolean;
}

export function FileViewer({ url, documentId, readOnly = false }: FileViewerProps) {
    const [pageRange, setPageRange] = useState("");
    const [isSplitting, setIsSplitting] = useState(false);

    if (!url || !documentId) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400">
                <p>Select a document to view</p>
            </div>
        );
    }

    const handleSplit = async () => {
        if (!pageRange) {
            if (!confirm("Split this document into separate pages?")) return;
        }

        setIsSplitting(true);
        try {
            let indices: number[] = [];
            if (pageRange) {
                indices = pageRange.split(',')
                    .map(s => parseInt(s.trim()))
                    .filter(n => !isNaN(n) && n > 0)
                    .map(n => n - 1); // Convert to 0-index
            }

            await splitDocument(documentId, indices.length > 0 ? indices : undefined);
            toast.success("Document split successfully");
            setPageRange("");
        } catch (e) {
            toast.error("Failed to split document");
            console.error(e);
        } finally {
            setIsSplitting(false);
        }
    };

    return (
        <div className="h-full flex flex-col bg-slate-800">
            {/* Toolbar */}
            {!readOnly && (
                <div className="h-14 bg-slate-900 flex items-center justify-between px-4 border-b border-slate-700">
                    <div className="text-white text-sm font-medium">Document Viewer</div>

                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            placeholder="Pages e.g. 1, 3"
                            className="h-8 w-32 bg-slate-800 border border-slate-600 rounded text-xs text-white px-2 focus:border-indigo-500 outline-none"
                            value={pageRange}
                            onChange={(e) => setPageRange(e.target.value)}
                        />
                        <Button
                            size="sm"
                            variant="secondary"
                            className="h-8 text-xs gap-1.5"
                            onClick={handleSplit}
                            disabled={isSplitting}
                        >
                            <Scissors className="w-3 h-3" />
                            {isSplitting ? "Splitting..." : "Split"}
                        </Button>
                    </div>
                </div>
            )}

            {/* Viewer Content */}
            <div className="flex-1 relative bg-slate-200">
                <iframe
                    src={`${url}#toolbar=0`}
                    className="w-full h-full border-none"
                    title="PDF Viewer"
                />
            </div>
        </div>
    );
}
