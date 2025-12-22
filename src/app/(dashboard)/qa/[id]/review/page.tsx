"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { submitQualityReview } from "@/lib/actions/qa";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";

export default function DocumentReviewPage({ params }: { params: { id: string } }) {
    const { data: session } = useSession();
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);

    // In a real app, verify session.user.id exists and has permissions

    const handleSubmit = async (status: "PASSED" | "FAILED" | "NEEDS_CORRECTION", formData: FormData) => {
        if (!session?.user?.id) return;
        setSubmitting(true);

        const score = parseInt(formData.get("score") as string || "100");
        const notes = formData.get("notes") as string;

        try {
            await submitQualityReview({
                documentId: params.id,
                reviewerId: session.user.id,
                status,
                score,
                notes
            });
            router.push("/qa");
        } catch (e) {
            console.error(e);
            alert("Failed to submit review");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="p-6 h-[calc(100vh-64px)] grid grid-cols-2 gap-6">
            {/* Viewer Section */}
            <div className="bg-gray-100 rounded-lg border flex items-center justify-center">
                {/* Embed Document Viewer here - Reusing viewer component would be ideal */}
                <p className="text-gray-500">Document Viewer Placeholder (ID: {params.id})</p>
            </div>

            {/* Review Form */}
            <div className="bg-white p-6 rounded-lg border shadow-sm flex flex-col">
                <h2 className="text-xl font-bold mb-6">Quality Review</h2>

                <form className="space-y-6 flex-1">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Quality Score (1-100)</label>
                        <input
                            name="score"
                            type="number"
                            defaultValue={100}
                            min={0}
                            max={100}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Review Notes</label>
                        <textarea
                            name="notes"
                            rows={5}
                            placeholder="Describe any errors found..."
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="pt-6 grid grid-cols-3 gap-3">
                        <button
                            type="button" // Use button type to prevent default submit, handled by separate actions
                            onClick={(e) => handleSubmit("PASSED", new FormData(e.currentTarget.closest('form')!))}
                            disabled={submitting}
                            className="flex flex-col items-center justify-center gap-2 p-4 border rounded-xl hover:bg-green-50 hover:border-green-200 text-gray-600 hover:text-green-700 transition"
                        >
                            <CheckCircle size={24} className="text-green-600" />
                            <span className="font-medium">Pass</span>
                        </button>

                        <button
                            type="button"
                            onClick={(e) => handleSubmit("NEEDS_CORRECTION", new FormData(e.currentTarget.closest('form')!))}
                            disabled={submitting}
                            className="flex flex-col items-center justify-center gap-2 p-4 border rounded-xl hover:bg-yellow-50 hover:border-yellow-200 text-gray-600 hover:text-yellow-700 transition"
                        >
                            <AlertTriangle size={24} className="text-yellow-600" />
                            <span className="font-medium">Correction</span>
                        </button>

                        <button
                            type="button"
                            onClick={(e) => handleSubmit("FAILED", new FormData(e.currentTarget.closest('form')!))}
                            disabled={submitting}
                            className="flex flex-col items-center justify-center gap-2 p-4 border rounded-xl hover:bg-red-50 hover:border-red-200 text-gray-600 hover:text-red-700 transition"
                        >
                            <XCircle size={24} className="text-red-600" />
                            <span className="font-medium">Fail</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
