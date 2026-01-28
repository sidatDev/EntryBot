"use client";

import { useState } from "react";
import { OperatorDocumentList } from "./OperatorDocumentList";
import { FileViewer } from "./FileViewer";
import { InvoiceForm } from "@/components/forms/InvoiceForm";

export function OperatorWorkspace({ documents, currentUser, orgId }: { documents: any[], currentUser: any, orgId: string }) {
    const [selectedDoc, setSelectedDoc] = useState<any | null>(null);

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-white">
            {/* 64px is approx header height. Adjust if needed. Using fixed height to enable scrolling in panes */}

            {/* Left Pane: List */}
            <div className="w-[400px] flex-shrink-0 h-full border-r border-slate-200">
                <OperatorDocumentList
                    documents={documents}
                    selectedDocId={selectedDoc?.id || null}
                    onSelectDoc={setSelectedDoc}
                    userId={currentUser.id}
                />
            </div>

            {/* Middle Pane: Viewer (Flexible) */}
            <div className="flex-1 h-full min-w-0 border-r border-slate-200">
                <FileViewer
                    url={selectedDoc?.url || null}
                    documentId={selectedDoc?.id || null}
                />
            </div>

            {/* Right Pane: Form (Fixed width like List?) */}
            <div className={`w-[500px] flex-shrink-0 h-full overflow-y-auto bg-white transition-all duration-300 ${!selectedDoc ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                {selectedDoc ? (
                    <InvoiceForm
                        documentId={selectedDoc.id}
                        documentUrl={selectedDoc.url}
                    />
                ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                        Select a document to edit details
                    </div>
                )}
            </div>
        </div>
    );
}
