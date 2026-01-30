"use client";

import { useState, useEffect } from "react";
import { Filter, X } from "lucide-react";

interface FilterPanelProps {
    onFilterChange: (filters: InvoiceFilters) => void;
    supplierOptions: string[];
    isOpen: boolean;
}

export interface InvoiceFilters {
    docId: string;
    documentType: string;
    supplierName: string;
    dateFrom: string;
    dateTo: string;
    amountMin: string;
    amountMax: string;
    category: string;
    approvalStatus: string;
    searchQuery: string;
}

export const initialFilters: InvoiceFilters = {
    docId: "",
    documentType: "",
    supplierName: "",
    dateFrom: "",
    dateTo: "",
    amountMin: "",
    amountMax: "",
    category: "",
    approvalStatus: "",
    searchQuery: "",
};

export function FilterPanel({ onFilterChange, supplierOptions, isOpen }: FilterPanelProps) {
    const [filters, setFilters] = useState<InvoiceFilters>(initialFilters);

    const activeFilterCount = Object.values(filters).filter(v => v !== "").length;

    const handleFilterUpdate = (key: keyof InvoiceFilters, value: string) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        onFilterChange(newFilters);
    };

    const clearAllFilters = () => {
        setFilters(initialFilters);
        onFilterChange(initialFilters);
    };

    // If panel is closed, we still want to keep the state, or reset it? 
    // Usually keep it. But we only render if open.
    if (!isOpen) return null;

    return (
        <div className="mb-4 animate-in slide-in-from-top-2 fade-in duration-200">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-slate-700">Filter Documents</h3>
                    {activeFilterCount > 0 && (
                        <button
                            onClick={clearAllFilters}
                            className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                            <X className="h-4 w-4" />
                            Clear All
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Doc ID */}
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                            Doc ID
                        </label>
                        <input
                            type="text"
                            placeholder="Search by ID..."
                            value={filters.docId}
                            onChange={(e) => handleFilterUpdate("docId", e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    {/* Document Type */}
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                            Document Type
                        </label>
                        <select
                            value={filters.documentType}
                            onChange={(e) => handleFilterUpdate("documentType", e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">All Types</option>
                            <option value="PDF">PDF</option>
                            <option value="IMAGE">Image</option>
                        </select>
                    </div>

                    {/* Supplier Name */}
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                            Supplier Name
                        </label>
                        <select
                            value={filters.supplierName}
                            onChange={(e) => handleFilterUpdate("supplierName", e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">All Suppliers</option>
                            {supplierOptions.map((supplier) => (
                                <option key={supplier} value={supplier}>
                                    {supplier}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                            Category
                        </label>
                        <select
                            value={filters.category}
                            onChange={(e) => handleFilterUpdate("category", e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">All Categories</option>
                            <option value="SALES_INVOICE">Sales Invoice</option>
                            <option value="PURCHASE_INVOICE">Purchase Invoice</option>
                            <option value="RECEIPT">Receipt</option>
                            <option value="BANK_STATEMENT">Bank Statement</option>
                            <option value="IDENTITY_CARD">ID Card</option>
                        </select>
                    </div>

                    {/* Date From */}
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                            Invoice Date From
                        </label>
                        <input
                            type="date"
                            value={filters.dateFrom}
                            onChange={(e) => handleFilterUpdate("dateFrom", e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    {/* Date To */}
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                            Invoice Date To
                        </label>
                        <input
                            type="date"
                            value={filters.dateTo}
                            onChange={(e) => handleFilterUpdate("dateTo", e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    {/* Amount Min */}
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                            Amount Min (£)
                        </label>
                        <input
                            type="number"
                            placeholder="0.00"
                            value={filters.amountMin}
                            onChange={(e) => handleFilterUpdate("amountMin", e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    {/* Amount Max */}
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                            Amount Max (£)
                        </label>
                        <input
                            type="number"
                            placeholder="999999.99"
                            value={filters.amountMax}
                            onChange={(e) => handleFilterUpdate("amountMax", e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    {/* Approval Status */}
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                            Approval Status
                        </label>
                        <select
                            value={filters.approvalStatus}
                            onChange={(e) => handleFilterUpdate("approvalStatus", e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">All Status</option>
                            <option value="PENDING">Pending</option>
                            <option value="APPROVED">Approved</option>
                            <option value="DENIED">Denied</option>
                        </select>
                    </div>

                    {/* Global Search */}
                    <div className="md:col-span-2 lg:col-span-3">
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                            Search All Fields
                        </label>
                        <input
                            type="text"
                            placeholder="Search across all fields..."
                            value={filters.searchQuery}
                            onChange={(e) => handleFilterUpdate("searchQuery", e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
