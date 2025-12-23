"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit } from "lucide-react";
import { bulkUpdateDocuments } from "@/lib/actions";

interface BulkEditModalProps {
    selectedIds: string[];
    onComplete: () => void;
}

const CATEGORY_OPTIONS = [
    { label: "Sales Invoice", value: "SALES_INVOICE" },
    { label: "Purchase Invoice", value: "PURCHASE_INVOICE" },
    { label: "Bank Statement", value: "STATEMENT" },
    { label: "Other", value: "OTHER" }
];
const PAYMENT_METHODS = ["None", "Cash", "Bank Transfer", "Credit Card", "Debit Card", "Commonwealth Bank"];

export function BulkEditModal({ selectedIds, onComplete }: BulkEditModalProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [category, setCategory] = useState<string>("");
    const [paymentMethod, setPaymentMethod] = useState<string>("");

    const handleUpdate = async () => {
        if (!category && !paymentMethod) return;
        setLoading(true);
        try {
            await bulkUpdateDocuments(selectedIds, {
                category: category || undefined,
                paymentMethod: paymentMethod || undefined
            });
            setOpen(false);
            onComplete();
        } catch (error) {
            console.error("Bulk update failed", error);
            alert("Failed to update documents");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button
                    disabled={selectedIds.length === 0}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 text-white rounded text-sm font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Edit className="h-4 w-4" /> Bulk Edit
                </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Bulk Edit Documents</DialogTitle>
                    <DialogDescription>
                        Update details for {selectedIds.length} selected documents. Leave fields empty to keep existing values.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="category" className="text-right">
                            Category
                        </Label>
                        <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                                {CATEGORY_OPTIONS.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="payment" className="text-right">
                            Payment
                        </Label>
                        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select payment method" />
                            </SelectTrigger>
                            <SelectContent>
                                {PAYMENT_METHODS.map((pm) => (
                                    <SelectItem key={pm} value={pm}>
                                        {pm}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleUpdate} disabled={loading || (!category && !paymentMethod)}>
                        {loading ? "Updating..." : "Save changes"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
