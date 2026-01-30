"use client";

import { useSearchParams } from "next/navigation";
import { DocumentList } from "@/components/documents/DocumentList";
import { getServerSession } from "next-auth"; // NOTE: This is client component, we pass auth via props or context usually. 
// But DocumentList takes currentUser. We should probably get it from session in page.tsx and pass it down.
// Wait, DocumentList is a client component but it takes currentUser as prop.
// Check Page.tsx again.

// Actually, let's look at how DocumentsPage does it.
// It fetches session and passes session.user.
// So I should update OtherDocumentsPage to fetch session and pass it to OtherDocumentExplorer, 
// and then OtherDocumentExplorer passes it to DocumentList.

interface OtherDocumentExplorerProps {
    initialDocuments: any[];
    currentUser?: any;
}

export function OtherDocumentExplorer({ initialDocuments, currentUser }: OtherDocumentExplorerProps) {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold text-slate-800">Other Documents</h1>
                <p className="text-slate-500">Manage miscellaneous documents and files.</p>
            </div>

            <DocumentList
                documents={initialDocuments}
                category="OTHER"
                currentUser={currentUser}
            />
        </div>
    );
}
