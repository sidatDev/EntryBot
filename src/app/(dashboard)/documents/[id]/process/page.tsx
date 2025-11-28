import { prisma } from "@/lib/prisma";
import { DocumentViewer } from "@/components/document/DocumentViewer";
import { InvoiceForm } from "@/components/forms/InvoiceForm";
import { notFound } from "next/navigation";
import { getInvoicesByDocument, updateDocumentStatus } from "@/lib/actions";
import { CheckCircle, FileText } from "lucide-react";
import Link from "next/link";

export default async function ProcessPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const document = await prisma.document.findUnique({
        where: { id },
    });

    if (!document) {
        notFound();
    }

    const invoices = await getInvoicesByDocument(id);

    return (
        <div className="fixed inset-0 top-0 left-64 z-0 flex flex-col h-screen bg-slate-50">
            {/* Header with document info and actions */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href="/documents"
                        className="text-sm text-slate-600 hover:text-indigo-600 transition-colors"
                    >
                        ← Back to Queue
                    </Link>
                    <div className="h-4 w-px bg-slate-300" />
                    <div>
                        <h2 className="font-semibold text-slate-800">{document.name}</h2>
                        <p className="text-xs text-slate-500">
                            {invoices.length} invoice{invoices.length !== 1 ? "s" : ""} created
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {document.status !== "COMPLETED" && (
                        <form action={async () => {
                            "use server";
                            await updateDocumentStatus(id, "COMPLETED");
                        }}>
                            <button
                                type="submit"
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium shadow-lg shadow-emerald-200"
                            >
                                <CheckCircle className="h-4 w-4" />
                                Mark as Complete
                            </button>
                        </form>
                    )}
                    {document.status === "COMPLETED" && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg font-medium">
                            <CheckCircle className="h-4 w-4" />
                            Completed
                        </div>
                    )}
                </div>
            </div>

            {/* Created Invoices List (if any) */}
            {invoices.length > 0 && (
                <div className="bg-indigo-50 border-b border-indigo-100 px-6 py-3">
                    <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-sm font-medium text-indigo-900">Created Invoices:</span>
                        {invoices.map((invoice) => (
                            <div
                                key={invoice.id}
                                className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-indigo-200 text-sm"
                            >
                                <FileText className="h-3 w-3 text-indigo-600" />
                                <span className="font-medium text-slate-700">{invoice.invoiceNumber}</span>
                                <span className="text-slate-400">•</span>
                                <span className="text-slate-600">${invoice.totalAmount?.toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Split View */}
            <div className="flex-1 flex overflow-hidden">
                <div className="w-1/2 h-full border-r border-slate-200 bg-white overflow-hidden">
                    <InvoiceForm documentId={document.id} />
                </div>
                <div className="w-1/2 h-full bg-slate-100 overflow-hidden">
                    <DocumentViewer url={document.url} type={document.type} />
                </div>
            </div>
        </div>
    );
}
