import { getDeletedDocuments } from "@/lib/actions";
import { DocumentList } from "@/components/documents/DocumentList";

export default async function RecycleBinPage() {
    const documents = await getDeletedDocuments();

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-red-700">Recycle Bin</h1>
                <p className="text-slate-500">Restore or permanently delete documents</p>
            </div>
            <DocumentList documents={documents} isRecycleBin={true} />
        </div>
    );
}
