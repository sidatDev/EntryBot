"use client";

import { useState, useEffect } from "react";
import { Document, Tag } from "@prisma/client";
import { DocumentListPanel } from "./DocumentListPanel";
import { DocumentViewer } from "./DocumentViewer";
import { DocumentPropertiesPanel } from "./DocumentPropertiesPanel";
import { UploadModal } from "@/components/upload/UploadModal";

type DocumentWithTags = Document & { tags: Tag[] };

interface OtherDocumentExplorerProps {
    initialDocuments: DocumentWithTags[];
}

export function OtherDocumentExplorer({ initialDocuments }: OtherDocumentExplorerProps) {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [documents, setDocuments] = useState(initialDocuments);

    // Update local state if props change (e.g. after server action revalidation)
    useEffect(() => {
        setDocuments(initialDocuments);
    }, [initialDocuments]);

    const selectedDocument = documents.find(d => d.id === selectedId) || null;

    return (
        <div className="flex flex-col h-[calc(100vh-80px)] bg-slate-50 -m-6 rounded-none">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200">
                <h1 className="text-lg font-bold text-slate-800">Other Documents</h1>
                <div className="flex items-center gap-3">
                    <UploadModal category="OTHER" />
                </div>
            </div>

            {/* 3 Pane Layout */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left: List */}
                <DocumentListPanel
                    documents={documents}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                />

                {/* Center: Viewer */}
                <DocumentViewer document={selectedDocument} />

                {/* Right: Properties */}
                <DocumentPropertiesPanel
                    key={selectedId} // Force remount on selection change to sync state
                    document={selectedDocument}
                />
            </div>
        </div>
    );
}
