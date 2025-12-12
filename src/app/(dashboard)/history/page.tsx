import { getDocuments } from "@/lib/actions";
import { DocumentList } from "@/components/documents/DocumentList";

export default async function HistoryPage() {
    const documents = await getDocuments();

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Upload History</h1>
                <p className="text-slate-500">View all uploaded documents timeline</p>
            </div>
            <DocumentList documents={documents} />
        </div>
    );
}
