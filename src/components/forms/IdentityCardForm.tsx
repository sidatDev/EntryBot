"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Save, FileText, Sparkles, User, MapPin, Calendar, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { saveIdentityCard } from "@/lib/actions/identity-cards"; // We just created this
import { getDocumentMetadata } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

// Schema Validation
const identityCardSchema = z.object({
    fullName: z.string().optional(),
    fatherName: z.string().optional(),
    gender: z.string().optional(),
    countryOfStay: z.string().optional(),
    identityNumber: z.string().optional(),

    // Dates need careful handling, keeping as optional strings for form
    dateOfIssue: z.string().optional(),
    dateOfBirth: z.string().optional(),
    dateOfExpiry: z.string().optional(),

    urduFullName: z.string().optional(),
    urduFatherName: z.string().optional(),

    currentAddress: z.string().optional(),
    permanentAddress: z.string().optional(),
    cardBackUrl: z.string().optional(),
});

type IdentityCardFormValues = z.infer<typeof identityCardSchema>;

export function IdentityCardForm({ documentId, documentUrl }: { documentId: string; documentUrl: string }) {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [processingAi, setProcessingAi] = useState(false);
    const [metadata, setMetadata] = useState<any>(null);

    const form = useForm<IdentityCardFormValues>({
        resolver: zodResolver(identityCardSchema),
        defaultValues: {
            fullName: "",
            fatherName: "",
            gender: "",
            countryOfStay: "",
            identityNumber: "",
            dateOfIssue: "",
            dateOfBirth: "",
            dateOfExpiry: "",
            urduFullName: "",
            urduFatherName: "",
            currentAddress: "",
            permanentAddress: "",
            cardBackUrl: "",
        },
    });

    const { setValue, watch } = form;

    useEffect(() => {
        getDocumentMetadata(documentId).then((data) => {
            setMetadata(data);
            if (data?.identityCard?.cardBackUrl) {
                setValue("cardBackUrl", data.identityCard.cardBackUrl);
            }
        });
    }, [documentId, setValue]);

    const onSubmit = async (data: IdentityCardFormValues) => {
        setSaving(true);
        try {
            await saveIdentityCard({
                ...data,
                documentId,
            });
            router.push("/documents"); // Or /id-cards
        } catch (error) {
            console.error("Failed to save ID Card:", error);
        } finally {
            setSaving(false);
        }
    };

    const handleAutoFill = async () => {
        setProcessingAi(true);
        try {
            const backUrl = watch("cardBackUrl");
            const urls = [documentUrl];
            if (backUrl) {
                urls.push(backUrl);
            }

            // Call Internal Proxy
            const response = await fetch("/api/process-url", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    url: documentUrl, // Legacy/Fallback
                    urls: urls,       // New Array Support
                    documentType: 3,  // ID Card Type
                    language: "ur"    // Hint for Urdu
                }),
            });

            let data;

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));

                // CHECK FOR STRUCTURED ERROR (e.g. CNIC Mismatch)
                if (errorData.detail) {
                    // Show the specific error message
                    const errorMessage = errorData.detail.details || errorData.detail.error?.text || "Validation Error";

                    toast.warning("Attention", {
                        description: errorMessage,
                        duration: 5000,
                    });

                    // Use partial/structured data if available
                    if (errorData.detail.mapped_data) {
                        data = errorData.detail.mapped_data;
                    } else {
                        // Prefix with "Validation Error" so the catch block knows it's already handled/shown
                        throw new Error("Validation Error: " + (errorData.error || errorMessage));
                    }
                } else {
                    throw new Error(errorData.error || `Failed to process document (${response.status})`);
                }
            } else {
                data = await response.json();
            }

            // Map Response to Form (Assuming structure matches user example)
            // Response has "structured_data": { "cardFront": {...}, "cardBack": {...} }

            if (data?.structured_data) {
                const front = data.structured_data.cardFront || {};
                const back = data.structured_data.cardBack || {};

                // Front Data
                if (front.fullName) setValue("fullName", front.fullName);
                if (front.fatherName) setValue("fatherName", front.fatherName);
                if (front.gender) setValue("gender", front.gender);
                if (front.countryOfStay) setValue("countryOfStay", front.countryOfStay);
                if (front.identityNumber) setValue("identityNumber", front.identityNumber);

                // Date Parsing helper (DD/MM/YYYY or DD.MM.YYYY -> YYYY-MM-DD)
                const parseDate = (d: string) => {
                    if (!d) return "";
                    // Normalize separators (replace . and - with /)
                    const normalized = d.replace(/[.-]/g, "/");
                    const parts = normalized.split("/");

                    if (parts.length !== 3) return "";

                    const [day, month, year] = parts;
                    return `${year}-${month}-${day}`;
                };

                if (front.dateOfIssue) setValue("dateOfIssue", parseDate(front.dateOfIssue));
                if (front.dateOfBirth) setValue("dateOfBirth", parseDate(front.dateOfBirth));
                if (front.dateOfExpiry) setValue("dateOfExpiry", parseDate(front.dateOfExpiry));

                if (front.urduFullName) setValue("urduFullName", front.urduFullName);
                if (front.urduFatherName) setValue("urduFatherName", front.urduFatherName);

                // Back Data
                if (back.currentAddress) setValue("currentAddress", back.currentAddress);
                if (back.permanentAddress) setValue("permanentAddress", back.permanentAddress);
            }

        } catch (error: any) {
            // Suppress console error for known validation warnings that have already been toasted
            if (error.message?.includes("Validation Error") || error.message?.includes("Attention:")) {
                console.log("Validation warning handled:", error.message);
                return;
            }

            console.error("AI Processing Error:", error);
            toast.error("Auto-fill Failed", { description: error.message || "Failed to auto-fill data. Please try again or fill manually." });
        } finally {
            setProcessingAi(false);
        }
    };

    // Styles
    const inputClass = "w-full border-b border-slate-300 focus:border-indigo-600 outline-none px-0 py-2 bg-transparent text-slate-800 placeholder:text-slate-400 sm:text-sm transition-colors";
    const labelClass = "text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 block";
    const sectionTitleClass = "text-sm font-bold text-indigo-600 uppercase tracking-wider mb-6 pb-2 border-b border-indigo-50 flex items-center gap-2";

    return (
        <div className="h-full flex flex-col bg-white">
            {/* Header / Actions */}
            <div className="px-8 py-5 flex items-center justify-between border-b border-slate-100/50">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 rounded-lg">
                        <User className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                        <h2 className="font-semibold text-slate-800 text-lg leading-tight">Identity Card Entry</h2>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                            <span>ID: <span className="font-mono text-slate-700">{documentId.split('-')[0]}...</span></span>
                            <span className="text-slate-300">•</span>
                            CNIC / NIC
                            <span className="text-slate-300">•</span>
                            {metadata && <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal bg-slate-100 text-slate-600 hover:bg-slate-200">{metadata.category}</Badge>}
                        </div>
                    </div>
                </div>
                <button
                    onClick={handleAutoFill}
                    disabled={processingAi}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-indigo-100 text-indigo-600 rounded-full hover:bg-indigo-50 hover:border-indigo-200 transition-all text-sm font-medium shadow-sm disabled:opacity-50"
                >
                    {processingAi ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    Auto-fill with AI
                </button>
            </div>

            {/* Scrollable Form Area */}
            <div className="flex-1 overflow-y-auto">
                <form className="max-w-4xl mx-auto p-8 space-y-8" onSubmit={form.handleSubmit(onSubmit)}>

                    {/* SECTION: Image Sources */}
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <FileText className="h-4 w-4" /> Source Images
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Front Side Name</label>
                                <div className="text-xs text-slate-700 font-medium break-all bg-white p-2.5 rounded border border-slate-200 flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-indigo-500" />
                                    {metadata?.name || "Loading..."}
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>Back Side Name</label>
                                <div className="text-xs text-slate-700 font-medium break-all bg-white p-2.5 rounded border border-slate-200 flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-indigo-500" />
                                    {watch("cardBackUrl")
                                        ? watch("cardBackUrl")?.split("/").pop()
                                        : "Not provided"
                                    }
                                </div>
                                {/* Hidden input to store actual URL for form submission/AI processing */}
                                <input type="hidden" {...form.register("cardBackUrl")} />
                            </div>
                        </div>
                    </div>

                    {/* SECTION 1: Personal Info */}
                    <div>
                        <h3 className={sectionTitleClass}>
                            <User className="h-4 w-4" /> Personal Information
                        </h3>
                        <div className="grid grid-cols-12 gap-8">
                            <div className="col-span-6">
                                <label className={labelClass}>Full Name (English)</label>
                                <input {...form.register("fullName")} className={inputClass} />
                            </div>
                            <div className="col-span-6 text-right" dir="rtl">
                                <label className={labelClass + " text-right"}>Full Name (Urdu)</label>
                                <input {...form.register("urduFullName")} className={inputClass + " text-right font-urdu"} placeholder="یا" />
                            </div>

                            <div className="col-span-6">
                                <label className={labelClass}>Father Name (English)</label>
                                <input {...form.register("fatherName")} className={inputClass} />
                            </div>
                            <div className="col-span-6 text-right" dir="rtl">
                                <label className={labelClass + " text-right"}>Father Name (Urdu)</label>
                                <input {...form.register("urduFatherName")} className={inputClass + " text-right font-urdu"} />
                            </div>

                            <div className="col-span-4">
                                <label className={labelClass}>Gender</label>
                                <input {...form.register("gender")} className={inputClass} placeholder="M / F" />
                            </div>
                            <div className="col-span-8">
                                <label className={labelClass}>Country of Stay</label>
                                <input {...form.register("countryOfStay")} className={inputClass} />
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: Card Details */}
                    <div>
                        <h3 className={sectionTitleClass}>
                            <CreditCard className="h-4 w-4" /> Card Details
                        </h3>
                        <div className="grid grid-cols-12 gap-8">
                            <div className="col-span-12">
                                <label className={labelClass}>Identity Number (CNIC)</label>
                                <input {...form.register("identityNumber")} className={inputClass + " font-mono text-lg tracking-widest"} placeholder="00000-0000000-0" />
                            </div>

                            <div className="col-span-4">
                                <label className={labelClass}>Date of Birth</label>
                                <input type="date" {...form.register("dateOfBirth")} className={inputClass} />
                            </div>
                            <div className="col-span-4">
                                <label className={labelClass}>Date of Issue</label>
                                <input type="date" {...form.register("dateOfIssue")} className={inputClass} />
                            </div>
                            <div className="col-span-4">
                                <label className={labelClass}>Date of Expiry</label>
                                <input type="date" {...form.register("dateOfExpiry")} className={inputClass} />
                            </div>
                        </div>
                    </div>

                    {/* SECTION 3: Address */}
                    <div>
                        <h3 className={sectionTitleClass}>
                            <MapPin className="h-4 w-4" /> Address Information
                        </h3>
                        <div className="space-y-6">
                            <div>
                                <label className={labelClass}>Current Address</label>
                                <textarea {...form.register("currentAddress")} rows={2} className={inputClass + " resize-none"} />
                            </div>
                            <div>
                                <label className={labelClass}>Permanent Address</label>
                                <textarea {...form.register("permanentAddress")} rows={2} className={inputClass + " resize-none"} />
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 pt-10 border-t border-slate-100 mt-8">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="px-6 py-2.5 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-8 py-2.5 bg-indigo-600 text-white font-medium rounded-lg shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center gap-2 ml-auto disabled:opacity-50"
                        >
                            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                            Save Record
                        </button>
                    </div>

                </form>
            </div>

            {/* Footer Metadata */}
            {metadata && (
                <div className="px-8 py-4 bg-white border-t border-slate-100 flex items-center gap-12 text-xs text-slate-500 mt-auto">
                    <div>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">File Name:</span>
                        <span className="font-medium text-slate-700 truncate block max-w-[200px]" title={metadata.name}>{metadata.name}</span>
                    </div>
                    <div>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Uploaded By:</span>
                        <span className="font-medium text-slate-700">{metadata.user?.name || "Unknown"}</span>
                    </div>
                    <div>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Upload Date:</span>
                        <span className="font-medium text-slate-700">{new Date(metadata.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
