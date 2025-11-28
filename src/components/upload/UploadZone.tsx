"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, File as FileIcon, Loader2, X } from "lucide-react";
import { uploadDocument } from "@/lib/actions";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

export function UploadZone() {
    const { data: session } = useSession();
    const [uploading, setUploading] = useState(false);
    const [files, setFiles] = useState<File[]>([]);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        setFiles((prev) => [...prev, ...acceptedFiles]);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            "application/pdf": [".pdf"],
            "image/*": [".png", ".jpg", ".jpeg"],
        },
    });

    const handleUpload = async () => {
        if (!session?.user?.id) return;
        setUploading(true);

        try {
            for (const file of files) {
                const formData = new FormData();
                formData.append("file", file);
                formData.append("userId", session.user.id);
                await uploadDocument(formData);
            }
            setFiles([]);
        } catch (error) {
            console.error("Upload failed", error);
        } finally {
            setUploading(false);
        }
    };

    const removeFile = (index: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-6">
            <div
                {...getRootProps()}
                className={cn(
                    "border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200",
                    isDragActive
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-slate-200 hover:border-indigo-400 hover:bg-slate-50"
                )}
            >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-4">
                    <div className="h-16 w-16 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                        <UploadCloud className="h-8 w-8" />
                    </div>
                    <div>
                        <p className="text-lg font-medium text-slate-700">
                            {isDragActive ? "Drop files here" : "Click or drag files to upload"}
                        </p>
                        <p className="text-sm text-slate-500 mt-1">
                            PDF, PNG, JPG (Max 10MB)
                        </p>
                    </div>
                </div>
            </div>

            {files.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <h3 className="font-medium text-slate-700">Selected Files ({files.length})</h3>
                        <button
                            onClick={handleUpload}
                            disabled={uploading}
                            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
                        >
                            {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
                            {uploading ? "Uploading..." : "Upload All"}
                        </button>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {files.map((file, i) => (
                            <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500">
                                        <FileIcon className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-700 truncate max-w-[300px]">
                                            {file.name}
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            {(file.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => removeFile(i)}
                                    className="text-slate-400 hover:text-red-500 p-2"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
