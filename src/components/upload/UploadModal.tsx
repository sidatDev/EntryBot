"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { UploadZone } from "./UploadZone";

interface UploadModalProps {
    category?: string;
}

export function UploadModal({ category = "SALES_INVOICE" }: UploadModalProps) {
    const [isOpen, setIsOpen] = useState(false);

    // Determine button text based on category
    const getButtonText = () => {
        switch (category) {
            case "SALES_INVOICE":
                return "Upload Sales Invoice";
            case "PURCHASE_INVOICE":
                return "Upload Purchase Invoice";
            case "STATEMENT":
                return "Upload Statement";
            case "OTHER":
                return "Upload Document";
            default:
                return "Upload Document";
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200"
            >
                <Upload className="h-4 w-4" />
                {getButtonText()}
            </button>

            <Modal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                title={getButtonText()}
            >
                <UploadZone category={category} />
            </Modal>
        </>
    );
}
