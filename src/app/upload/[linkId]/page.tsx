"use client";

import { useState } from "react";
import { Upload, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { uploadDocument } from "@/lib/actions"; // We'll need a public version ideally, or handle auth gracefully

// This page is meant to be accessible without login, but for MVP we might require it or use a shared token.
// For now, we assume this is a public facing page that submits to a generic 'Inbox' for the Org.

export default function PublicUploadPage({ params }: { params: { linkId: string } }) {
    const [uploading, setUploading] = useState(false);
    const [status, setStatus] = useState<"IDLE" | "SUCCESS" | "ERROR">("IDLE");

    async function handleUpload(formData: FormData) {
        setUploading(true);
        setStatus("IDLE");
        try {
            // In a real implementation:
            // 1. Validate 'linkId' corresponds to a valid Organization
            // 2. Call a server action that doesn't require session auth (but validates the linkId token)

            // Simulating a delay for UI demo
            await new Promise(resolve => setTimeout(resolve, 2000));
            setStatus("SUCCESS");
        } catch (e) {
            console.error(e);
            setStatus("ERROR");
        } finally {
            setUploading(false);
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-blue-600 p-6 text-center">
                    <div className="mx-auto bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm">
                        <Upload className="text-white h-8 w-8" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">Secure Document Upload</h1>
                    <p className="text-blue-100 text-sm mt-1">Upload your invoices or receipts securely.</p>
                </div>

                <div className="p-8">
                    {status === "SUCCESS" ? (
                        <div className="text-center py-8">
                            <div className="mx-auto bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle className="text-green-600 h-8 w-8" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">Upload Complete!</h3>
                            <p className="text-gray-500 mt-2 mb-6">Your document has been securely received.</p>
                            <button
                                onClick={() => setStatus("IDLE")}
                                className="text-blue-600 font-medium hover:underline"
                            >
                                Upload Another
                            </button>
                        </div>
                    ) : (
                        <form action={handleUpload} className="space-y-6">
                            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer group">
                                <input
                                    type="file"
                                    name="file"
                                    required
                                    className="hidden"
                                    id="file-upload"
                                />
                                <label htmlFor="file-upload" className="cursor-pointer">
                                    <FileText className="mx-auto h-10 w-10 text-gray-400 group-hover:text-blue-500 transition-colors mb-3" />
                                    <span className="block text-sm font-medium text-gray-900">
                                        Click to select file
                                    </span>
                                    <span className="block text-xs text-gray-500 mt-1">
                                        PDF, JPG, PNG up to 10MB
                                    </span>
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={uploading}
                                className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 disabled:opacity-70 flex items-center justify-center gap-2"
                            >
                                {uploading ? (
                                    <>Processing...</>
                                ) : (
                                    <>Upload Document</>
                                )}
                            </button>
                        </form>
                    )}
                </div>

                <div className="bg-gray-50 px-8 py-4 text-center border-t border-gray-100">
                    <p className="text-xs text-gray-400">Powered by EntryBot • Secure Transfer</p>
                </div>
            </div>
        </div>
    );
}
