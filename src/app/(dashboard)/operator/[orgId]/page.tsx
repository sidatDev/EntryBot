import { getDocuments } from "@/lib/actions";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { OperatorWorkspace } from "@/components/operator/OperatorWorkspace";

export default async function OperatorWorkspacePage({
    params,
    searchParams
}: {
    params: Promise<{ orgId: string }>;
    searchParams: Promise<{ category?: string; orderId?: string }>; // Added orderId
}) {
    const { orgId } = await params;
    const { category, orderId } = await searchParams; // Extract orderId

    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/login");

    const user = session.user;

    // Fetch documents
    // Note: getDocuments logic for Operator might restrict to assignedToId.
    // If that becomes an issue, we will need to adjust getDocuments or use a direct query.
    let documents = await getDocuments(undefined, undefined, undefined, undefined, orgId);

    // CRITICAL: Filter by orderId first if specified (highest priority)
    if (orderId) {
        documents = documents.filter((doc: any) => doc.orderId === orderId);
    }

    // Filter based on Intention (Category Param)
    if (category) {
        documents = documents.filter((doc: any) => {
            if (category === "INVOICE") {
                return doc.category === "SALES_INVOICE" || doc.category === "PURCHASE_INVOICE" || doc.category === "INVOICE";
            }
            if (category === "STATEMENT") {
                return doc.category === "BANK_STATEMENT" || doc.category === "STATEMENT";
            }
            if (category === "OTHER") {
                return !["SALES_INVOICE", "PURCHASE_INVOICE", "INVOICE", "BANK_STATEMENT", "STATEMENT"].includes(doc.category);
            }
            return true;
        });
    }

    return (
        <div className="h-full">
            <OperatorWorkspace
                documents={documents}
                currentUser={user}
                orgId={orgId}
            />
        </div>
    );
}
