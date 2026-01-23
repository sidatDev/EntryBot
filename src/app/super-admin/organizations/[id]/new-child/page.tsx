"use client"

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { createChildOrganization } from "@/lib/actions/organization";

export default function NewChildOrganizationPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        setError(null);

        const data = {
            name: formData.get('name') as string,
            type: "CHILD_CLIENT" as const,
            parentId: id, // Link to Parent Master Client
            adminName: formData.get('adminName') as string,
            adminEmail: formData.get('adminEmail') as string,
            adminPassword: formData.get('adminPassword') as string,
        };

        const result = await createChildOrganization(data);

        if (result.error) {
            setError(result.error);
            setLoading(false);
        } else {
            router.push(`/super-admin/organizations/${id}`);
            router.refresh();
        }
    }

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Add Sub-Account</h1>
            <p className="text-gray-500 mb-6">Create a new Child Client under this Master Client.</p>

            <form action={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border space-y-6">

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sub-Account Name</label>
                    <input
                        name="name"
                        required
                        type="text"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="e.g. Acme Retail Branch"
                    />
                </div>

                <div className="border-t pt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Initial Manager/Admin</h3>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Manager Name</label>
                            <input
                                name="adminName"
                                required
                                type="text"
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Manager Name"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Manager Email</label>
                            <input
                                name="adminEmail"
                                required
                                type="email"
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="manager@branch.com"
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Default Password</label>
                            <input
                                name="adminPassword"
                                required
                                type="password"
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                defaultValue="welcome123"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
                    >
                        {loading ? "Creating..." : "Create Sub-Account"}
                    </button>
                </div>
            </form>
        </div>
    );
}
