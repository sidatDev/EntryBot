"use client";

import { UploadModal } from "@/components/upload/UploadModal";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

interface ClientUploadWrapperProps {
    category: string;
    label: string;
}

export function ClientUploadWrapper({ category, label }: ClientUploadWrapperProps) {
    // Note: UploadModal has its own button, but it hardcodes text based on category.
    // Ideally we update UploadModal to accept a custom label.
    // For now, let's just use UploadModal as is, OR wrap it if we modify it.
    // Actually, looking at UploadModal code, it hardcodes button styles too.
    // Let's modify UploadModal slightly in next step to be more flexible, 
    // BUT for now, I'll just render it. The "label" prop here might be ignored 
    // unless I pass it down if I change UploadModal.

    // Hack: We can just use UploadModal directly if we don't mind the default text.
    // But user wants specific 3 buttons.
    // Let's assume I will update UploadModal to accept `trigger` or `label`.

    return <UploadModal category={category} label={label} />;
}
