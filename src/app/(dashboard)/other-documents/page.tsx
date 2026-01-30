import { getOtherDocuments } from "@/lib/actions";
import { OtherDocumentExplorer } from "@/components/documents/OtherDocumentExplorer";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function OtherDocumentsPage({
    searchParams,
}: {
    searchParams: Promise<{ orgId?: string }>;
}) {
    const { orgId } = await searchParams;
    const session = await getServerSession(authOptions);
    const documents = await getOtherDocuments(orgId);

    return (
        <OtherDocumentExplorer
            initialDocuments={documents}
            currentUser={session?.user}
        />
    );
}
