"use client";

import { updatePackage } from "@/lib/actions/packages";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { RichTextEditor } from "@/components/ui/RichTextEditor";

interface EditPackageFormProps {
    pkg: {
        id: string;
        name: string;
        price: number;
        monthlyCredits: number;
        description: string | null;
    }
}

export function EditPackageForm({ pkg }: EditPackageFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [description, setDescription] = useState(pkg.description || "");

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        const name = formData.get("name") as string;
        const price = parseFloat(formData.get("price") as string);
        const monthlyCredits = parseInt(formData.get("monthlyCredits") as string);
        // description is from state

        try {
            await updatePackage(pkg.id, { name, price, monthlyCredits, description });
            router.push("/super-admin/packages");
            router.refresh();
        } catch (error) {
            console.error(error);
            alert("Failed to update package");
        } finally {
            setLoading(false);
        }
    }

    return (
        <form action={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Package Name</label>
                <input
                    name="name"
                    defaultValue={pkg.name}
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
                        defaultValue={pkg.price}
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
                        defaultValue={pkg.monthlyCredits}
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
                    {loading ? "Saving Changes..." : "Save Changes"}
                </button>
            </div>
        </form>
    );
}
