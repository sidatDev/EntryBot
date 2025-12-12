"use client";

import { Document } from "@prisma/client";

interface DocumentViewerProps {
    document: Document | null;
}

export function DocumentViewer({ document }: DocumentViewerProps) {
    if (!document) {
        return (
            <div className="flex-1 flex items-center justify-center bg-slate-50 text-slate-400">
                <p>Select a document to view</p>
            </div>
        );
    }

    const fileType = document.type === "PDF" ? "application/pdf" : "image/jpeg"; // Simplified MIME type logic

    return (
        <div className="flex-1 bg-slate-100 flex flex-col h-full overflow-hidden relative">
            {/* If PDF, use object/iframe. If Image, use img */}
            {document.type === "PDF" ? (
                <iframe
                    src={document.url}
                    className="w-full h-full border-none"
                    title="Document Viewer"
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center overflow-auto p-4">
                    <img
                        src={document.url}
                        alt={document.name}
                        className="max-w-full max-h-full object-contain shadow-lg rounded-lg"
                    />
                </div>
            )}
        </div>
    );
}
