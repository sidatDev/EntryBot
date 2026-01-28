import { getOtherDocuments } from "@/lib/actions";
import { OtherDocumentExplorer } from "@/components/documents/OtherDocumentExplorer";

export default async function OtherDocumentsPage({
    searchParams,
}: {
    searchParams: Promise<{ orgId?: string }>;
}) {
    const { orgId } = await searchParams;
    const documents = await getOtherDocuments(orgId);

    return (
        <OtherDocumentExplorer initialDocuments={documents} />
    );
}
