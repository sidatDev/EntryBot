import { getDocuments, exportInvoicesToCSV } from "@/lib/actions";
import { UploadModal } from "@/components/upload/UploadModal";
import { FileText, ArrowRight, Calendar, Download } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default async function DocumentsPage() {
    const documents = await getDocuments();

    async function handleExport() {
        "use server";
        const csv = await exportInvoicesToCSV();
        return csv;
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Document Queue</h1>
                    <p className="text-slate-500">Manage and process your uploaded files</p>
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
                    <UploadModal />
                </div>
            </div>


            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-slate-700">Document</th>
                                <th className="px-6 py-4 font-semibold text-slate-700">Status</th>
                                <th className="px-6 py-4 font-semibold text-slate-700">Invoices</th>
                                <th className="px-6 py-4 font-semibold text-slate-700">Uploaded</th>
                                <th className="px-6 py-4 font-semibold text-slate-700 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {documents.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                        No documents found. Upload some to get started.
                                    </td>
                                </tr>
                            ) : (
                                documents.map((doc) => (
                                    <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                                                    <FileText className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-900">{doc.name}</p>
                                                    <p className="text-xs text-slate-500">
                                                        {(doc.size / 1024 / 1024).toFixed(2)} MB • {doc.type}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={cn(
                                                    "px-2.5 py-1 rounded-full text-xs font-medium",
                                                    doc.status === "COMPLETED"
                                                        ? "bg-emerald-100 text-emerald-700"
                                                        : doc.status === "PROCESSING"
                                                            ? "bg-amber-100 text-amber-700"
                                                            : "bg-slate-100 text-slate-700"
                                                )}
                                            >
                                                {doc.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5">
                                                <FileText className="h-3.5 w-3.5 text-slate-400" />
                                                <span className="text-slate-600 font-medium">
                                                    {doc._count.invoices}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-3 w-3" />
                                                {new Date(doc.createdAt).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link
                                                href={`/documents/${doc.id}/process`}
                                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors font-medium text-xs"
                                            >
                                                Process
                                                <ArrowRight className="h-3 w-3" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
