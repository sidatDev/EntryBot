"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { UploadZone } from "./UploadZone";

interface UploadModalProps {
    category?: "SALES" | "PURCHASE" | "GENERAL" | "STATEMENT" | "OTHER";
}

export function UploadModal({ category = "GENERAL" }: UploadModalProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-lg"
            >
                <Upload className="h-4 w-4" />
                Upload Documents
            </button>

            <Modal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                title="Upload Documents"
            >
                <UploadZone category={category} />
            </Modal>
        </>
    );
}
