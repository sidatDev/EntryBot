import { getQAQueue } from "@/lib/actions/qa";
import Link from "next/link";
import { CheckCircle, XCircle, AlertCircle, FileText } from "lucide-react";

export default async function QAQueuePage() {
    // In a real app, filtering by user's organization would happen here via session
    const queue = await getQAQueue();

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <CheckCircle className="text-blue-600" />
                Quality Assurance Queue
            </h1>

            {queue.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <CheckCircle className="mx-auto text-gray-400 mb-4 h-12 w-12" />
                    <h3 className="text-lg font-medium text-gray-900">All Cleared!</h3>
                    <p className="text-gray-500">No documents pending QA review.</p>
                </div>
            ) : (
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200 font-medium text-gray-500 uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Document</th>
                                <th className="px-6 py-4">Submitted By</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Preview</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {queue.map((doc) => (
                                <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                                <FileText size={20} />
                                            </div>
                                            <span className="font-medium text-gray-900">{doc.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-gray-900 font-medium">{doc.user?.name || "Unknown"}</div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">
                                        <div className="flex flex-col">
                                            <span>{doc.updatedAt.toLocaleDateString()}</span>
                                            {/* SLA Check: > 24 hours */}
                                            {new Date().getTime() - new Date(doc.updatedAt).getTime() > 24 * 60 * 60 * 1000 && (
                                                <span className="text-xs text-red-600 font-bold flex items-center gap-1 mt-1">
                                                    <AlertCircle size={12} />
                                                    SLA Breached
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">
                                        {doc.invoices[0] ? (
                                            <span className="text-gray-900 font-mono font-medium">
                                                {doc.invoices.length > 0 && doc.invoices[0].totalAmount
                                                    ? `$${doc.invoices[0].totalAmount.toFixed(2)}`
                                                    : '-'}
                                            </span>
                                        ) : 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Link
                                            href={`/qa/${doc.id}/review`}
                                            className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition"
                                        >
                                            Review
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
