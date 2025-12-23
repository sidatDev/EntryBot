"use client";

import { deletePackage } from "@/lib/actions/packages";
import { Trash2 } from "lucide-react";
import { useState } from "react";

export function DeletePackageButton({ id, name }: { id: string; name: string }) {
    const [loading, setLoading] = useState(false);

    async function handleDelete() {
        if (!confirm(`Are you sure you want to delete the package "${name}"? This action cannot be undone.`)) return;

        setLoading(true);
        try {
            await deletePackage(id);
        } catch (error) {
            alert((error as Error).message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <button
            onClick={handleDelete}
            disabled={loading}
            className="px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50 disabled:opacity-50 flex items-center justify-center gap-2"
        >
            <Trash2 size={16} />
            {loading ? "Deleting..." : "Delete"}
        </button>
    );
}
