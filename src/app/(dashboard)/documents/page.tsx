import { getDocuments, exportInvoicesToCSV } from "@/lib/actions";
import { UploadModal } from "@/components/upload/UploadModal";
import { Download } from "lucide-react";
import { DocumentList } from "@/components/documents/DocumentList";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Category = "SALES" | "PURCHASE" | "GENERAL";

export default async function DocumentsPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const params = await searchParams;
    const category = (params.category as Category) || undefined;

    // Validate category to ensure it matches allowed types
    const validCategory = category && ["SALES", "PURCHASE", "GENERAL"].includes(category)
        ? category
        : undefined;

    const documents = await getDocuments(validCategory);

    const title = validCategory === "SALES"
        ? "Sales Invoices"
        : validCategory === "PURCHASE"
            ? "Purchase Invoices"
            : "Document Queue";

    async function handleExport() {
        "use server";
        const csv = await exportInvoicesToCSV();
        return csv;
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
                    <p className="text-slate-500">Manage and process your {validCategory ? validCategory.toLowerCase() : "uploaded"} files</p>
                </div>
                <div className="flex items-center gap-3">
                    <form action={async () => {
                        "use server";
                        const csv = await exportInvoicesToCSV();
                        // Note: In a real app, you'd trigger a download here
                        // For now, we'll just log it
                        console.log("CSV Export:", csv);
                    }}>
                        <button
                            type="submit"
                            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
                        >
                            <Download className="h-4 w-4" />
                            Export CSV
                        </button>
                    </form>
                    <UploadModal category={validCategory} />
                </div>
            </div>





            <DocumentList documents={documents} />
        </div >
    );
}
