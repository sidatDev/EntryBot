"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, File as FileIcon, Loader2, X } from "lucide-react";
import { uploadDocument } from "@/lib/actions";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

interface UploadZoneProps {
    category?: string;
    organizationId?: string;
}

export function UploadZone({ category = "SALES_INVOICE", organizationId }: UploadZoneProps) {
    const { data: session } = useSession();
    const [frontFile, setFrontFile] = useState<File | null>(null);
    const [backFile, setBackFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [files, setFiles] = useState<File[]>([]);

    // Derived state to ensure it updates when prop changes
    const idUploadMode = category === "IDENTITY_CARD";

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (idUploadMode) {
            // In ID Mode, dropping files is tricky to map to front/back.
            // For simplicity, if front is empty, take first as front. If front exists, take as back.
            if (!frontFile && acceptedFiles.length > 0) {
                setFrontFile(acceptedFiles[0]);
                if (acceptedFiles.length > 1) setBackFile(acceptedFiles[1]);
            } else if (frontFile && !backFile && acceptedFiles.length > 0) {
                setBackFile(acceptedFiles[0]);
            }
        } else {
            setFiles((prev) => [...prev, ...acceptedFiles]);
        }
    }, [idUploadMode, frontFile, backFile]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            "application/pdf": [".pdf"],
            "image/*": [".png", ".jpg", ".jpeg"],
        },
        maxFiles: idUploadMode ? 2 : undefined
    });

    const handleUpload = async () => {
        if (!(session?.user as any)?.id) return;
        setUploading(true);

        try {
            if (idUploadMode) {
                // IDENTITY CARD FLOW
                if (!frontFile || !backFile) {
                    alert("Both Front and Back side images are required");
                    setUploading(false);
                    return;
                }

                const formData = new FormData();
                formData.append("frontFile", frontFile);
                formData.append("backFile", backFile);
                formData.append("userId", (session?.user as any)?.id);

                console.log("Client: Uploading ID Card...");
                // Keep this import dynamic or top-level? Top level is better. 
                // Assuming logic to call the new action exists.
                // We need to import the action. Since we can't change imports easily in this block,
                // we'll assume the action is imported or we use a dynamic import workaround if needed.
                // *Self-correction*: I should update imports in a separate step or add it here if I am replacing the whole file. 
                // Since I am replacing a chunk, I need to make sure `uploadIdentityCardWithBackImage` is available.
                // I will add the import in a separate `multi_replace` or just use `require` if specific to this block, strictly strict mode TS might block require.
                // BETTER: I will replace the whole file content to ensure imports are clean. (Changing strategy to whole file replacer in next turn if this fails, but wait, `replace_file_content` checks imports? No.)
                // I will update imports in a second edit.

                const { uploadIdentityCardWithBackImage } = await import("@/lib/actions/upload-identity");
                await uploadIdentityCardWithBackImage(formData);

                setFrontFile(null);
                setBackFile(null);

            } else {
                // STANDARD FLOW
                for (const file of files) {
                    const formData = new FormData();
                    formData.append("file", file);
                    formData.append("userId", (session?.user as any)?.id);
                    formData.append("category", category);
                    if (organizationId) {
                        formData.append("organizationId", organizationId);
                    }
                    console.log("Client: Uploading...", file.name, organizationId ? `to Org ${organizationId}` : "");
                    await uploadDocument(formData);
                    console.log("Client: Upload complete");
                }
                setFiles([]);
            }

            // alert("Upload Successful!");
            window.location.reload();
        } catch (error) {
            console.error("Upload failed", error);
            alert("Upload Failed: " + (error as Error).message);
        } finally {
            setUploading(false);
        }
    };

    const removeFile = (index: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    };

    // --- ID CARD UI RENDERER ---
    if (idUploadMode) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    {/* FRONT SIDE */}
                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-indigo-400 hover:bg-slate-50 transition-all relative">
                        <input
                            type="file"
                            accept="image/*,application/pdf"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={(e) => {
                                if (e.target.files?.[0]) setFrontFile(e.target.files[0]);
                            }}
                        />
                        <div className="flex flex-col items-center gap-2">
                            <div className={cn("h-12 w-12 rounded-full flex items-center justify-center", frontFile ? "bg-green-100 text-green-600" : "bg-indigo-50 text-indigo-600")}>
                                {frontFile ? <FileIcon className="h-6 w-6" /> : <UploadCloud className="h-6 w-6" />}
                            </div>
                            <div className="text-sm font-medium text-slate-700">
                                {frontFile ? frontFile.name : "Front Side"}
                            </div>
                            {!frontFile && <span className="text-xs text-slate-400">Click to Select</span>}
                        </div>
                        {frontFile && (
                            <button
                                onClick={(e) => { e.stopPropagation(); setFrontFile(null); }}
                                className="absolute top-2 right-2 text-slate-400 hover:text-red-500 z-10"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    {/* BACK SIDE */}
                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-indigo-400 hover:bg-slate-50 transition-all relative">
                        <input
                            type="file"
                            accept="image/*,application/pdf"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={(e) => {
                                if (e.target.files?.[0]) setBackFile(e.target.files[0]);
                            }}
                        />
                        <div className="flex flex-col items-center gap-2">
                            <div className={cn("h-12 w-12 rounded-full flex items-center justify-center", backFile ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-400")}>
                                {backFile ? <FileIcon className="h-6 w-6" /> : <UploadCloud className="h-6 w-6" />}
                            </div>
                            <div className="text-sm font-medium text-slate-700">
                                {backFile ? backFile.name : "Back Side (Required)"}
                            </div>
                            {!backFile && <span className="text-xs text-slate-400">Click to Select</span>}
                        </div>
                        {backFile && (
                            <button
                                onClick={(e) => { e.stopPropagation(); setBackFile(null); }}
                                className="absolute top-2 right-2 text-slate-400 hover:text-red-500 z-10"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                </div>

                <button
                    onClick={handleUpload}
                    disabled={uploading || !frontFile}
                    className="w-full py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                >
                    {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
                    {uploading ? "Uploading ID Card..." : "Upload ID Card"}
                </button>
            </div>
        );
    }

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
