"use client";

import { createPackage } from "@/lib/actions/packages";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { RichTextEditor } from "@/components/ui/RichTextEditor";

export default function NewPackagePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [description, setDescription] = useState("");

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        const name = formData.get("name") as string;
        const price = parseFloat(formData.get("price") as string);
        const monthlyCredits = parseInt(formData.get("monthlyCredits") as string);
        // description is from state variable

        try {
            await createPackage({ name, price, monthlyCredits, description });
            router.push("/super-admin/packages");
        } catch (error) {
            console.error(error);
            alert("Failed to create package");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <Link href="/super-admin/packages" className="flex items-center text-gray-500 hover:text-gray-900 mb-6">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Packages
            </Link>

            <h1 className="text-2xl font-bold mb-6">Create New Package</h1>

            <form action={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Package Name</label>
                    <input
                        name="name"
                        required
                        placeholder="e.g. Platinum Plan"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                        <input
                            name="price"
                            type="number"
                            step="0.01"
                            required
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Credits</label>
                        <input
                            name="monthlyCredits"
                            type="number"
                            required
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <RichTextEditor
                        value={description}
                        onChange={setDescription}
                        placeholder="Describe the package benefits..."
                    />
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? "Creating..." : "Create Package"}
                    </button>
                </div>
            </form>
        </div>
    );
}
