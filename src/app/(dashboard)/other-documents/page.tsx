import { getOtherDocuments } from "@/lib/actions";
import { OtherDocumentExplorer } from "@/components/documents/OtherDocumentExplorer";

export default async function OtherDocumentsPage() {
    const documents = await getOtherDocuments();

    return (
        <OtherDocumentExplorer initialDocuments={documents} />
    );
}
