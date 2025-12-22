import { getDocuments } from "@/lib/actions";
import { DocumentList } from "@/components/documents/DocumentList";

export default async function DocumentsPage({
    searchParams,
}: {
    searchParams: Promise<{ category?: string; assignedTo?: string }>;
}) {
    const { category, assignedTo } = await searchParams;

    // Fetch documents based on category
    const documents = await getDocuments(category, undefined, assignedTo);

    // Determine page title based on category
    const pageTitle = category === "SALES_INVOICE"
        ? "Sales Invoices & Receipts"
        : category === "PURCHASE_INVOICE"
            ? "Purchase Invoices & Receipts"
            : "All Invoices & Receipts";

    const pageDescription = category === "SALES_INVOICE"
        ? "Manage your sales invoices and receipts"
        : category === "PURCHASE_INVOICE"
            ? "Manage your purchase invoices and receipts"
            : "Manage all your invoices and receipts";

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold text-slate-800">{pageTitle}</h1>
                <p className="text-slate-500">{pageDescription}</p>
            </div>

            <DocumentList documents={documents} category={category} />
        </div>
    );
}
