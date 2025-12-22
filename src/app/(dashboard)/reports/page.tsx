"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, FileJson, Calendar } from "lucide-react";
import { generateExport } from "@/lib/export";
import { useSession } from "next-auth/react";

export default function ReportsPage() {
    const { data: session } = useSession();
    const [generating, setGenerating] = useState(false);

    const handleDownload = async (format: "CSV" | "JSON") => {
        const orgId = (session?.user as any)?.organizationId;
        if (!orgId) return;
        setGenerating(true);
        try {
            // In a real app, this should probably stream or return a valid download link/blob
            const data = await generateExport(orgId, format);

            // Client-side download trigger
            const blob = new Blob([data], { type: format === "CSV" ? "text/csv" : "application/json" });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `entrybot-export-${new Date().toISOString().split('T')[0]}.${format.toLowerCase()}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } catch (e) {
            console.error(e);
            alert("Export failed");
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Reports & Analytics</h1>
            <p className="text-gray-500 mb-8">Export your data for external analysis or bookkeeping.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Export Card */}
                <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
                    <div className="bg-blue-50 w-12 h-12 rounded-xl flex items-center justify-center mb-6 text-blue-600">
                        <Download size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Data Export</h3>
                    <p className="text-gray-500 mb-6">
                        Download all processed documents and their extracted data including line items.
                    </p>

                    <div className="space-y-3">
                        <button
                            onClick={() => handleDownload("CSV")}
                            disabled={generating}
                            className="w-full flex items-center justify-between p-4 border rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <FileSpreadsheet className="text-green-600" />
                                <span className="font-medium text-gray-700 group-hover:text-blue-700">Export as CSV</span>
                            </div>
                            <span className="text-xs font-semibold bg-gray-100 text-gray-500 px-2 py-1 rounded group-hover:bg-white">
                                EXCEL COMPATIBLE
                            </span>
                        </button>

                        <button
                            onClick={() => handleDownload("JSON")}
                            disabled={generating}
                            className="w-full flex items-center justify-between p-4 border rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <FileJson className="text-yellow-600" />
                                <span className="font-medium text-gray-700 group-hover:text-purple-700">Export as JSON</span>
                            </div>
                            <span className="text-xs font-semibold bg-gray-100 text-gray-500 px-2 py-1 rounded group-hover:bg-white">
                                RAW DATA
                            </span>
                        </button>
                    </div>
                </div>

                {/* Placeholder for Financial Summary */}
                <div className="bg-gray-50 p-8 rounded-2xl border border-dashed border-gray-300 flex flex-col items-center justify-center text-center">
                    <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mb-4 text-gray-400">
                        <Calendar size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Financial Reports</h3>
                    <p className="text-gray-500 mt-2 max-w-xs">
                        Advanced expense categorization and monthly summaries are coming soon.
                    </p>
                </div>
            </div>
        </div>
    );
}
