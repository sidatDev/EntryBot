"use client";

import { Trash2, Plus } from "lucide-react";

interface LineItem {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
}

interface LineItemsTableProps {
    items: LineItem[];
    onChange: (items: LineItem[]) => void;
    readOnly?: boolean;
}

export function LineItemsTable({ items, onChange, readOnly = false }: LineItemsTableProps) {
    const addRow = () => {
        if (readOnly) return;
        const newItem: LineItem = {
            id: `temp-${Date.now()}`,
            description: "",
            quantity: 1,
            unitPrice: 0,
            total: 0,
        };
        onChange([...items, newItem]);
    };

    const removeRow = (id: string) => {
        if (readOnly) return;
        onChange(items.filter((item) => item.id !== id));
    };

    const updateRow = (id: string, field: keyof LineItem, value: string | number) => {
        if (readOnly) return;
        const updatedItems = items.map((item) => {
            if (item.id === id) {
                const updated = { ...item, [field]: value };

                // Auto-calculate total
                if (field === "quantity" || field === "unitPrice") {
                    updated.total = Number(updated.quantity) * Number(updated.unitPrice);
                }

                return updated;
            }
            return item;
        });
        onChange(updatedItems);
    };

    const subtotal = items.reduce((sum, item) => sum + item.total, 0);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-700">Line Items</h3>
                {!readOnly && (
                    <button
                        type="button"
                        onClick={addRow}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        Add Item
                    </button>
                )}
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3 text-left font-semibold text-slate-700">Description</th>
                                <th className="px-4 py-3 text-left font-semibold text-slate-700 w-24">Qty</th>
                                <th className="px-4 py-3 text-left font-semibold text-slate-700 w-32">Unit Price</th>
                                <th className="px-4 py-3 text-left font-semibold text-slate-700 w-32">Total</th>
                                {!readOnly && <th className="px-4 py-3 w-12"></th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {items.length === 0 ? (
                                <tr>
                                    <td colSpan={readOnly ? 4 : 5} className="px-4 py-8 text-center text-slate-400">
                                        No items added.
                                    </td>
                                </tr>
                            ) : (
                                items.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-3">
                                            <input
                                                type="text"
                                                value={item.description}
                                                onChange={(e) => updateRow(item.id, "description", e.target.value)}
                                                className="w-full px-2 py-1.5 rounded border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none disabled:bg-transparent disabled:border-transparent"
                                                placeholder="Item description"
                                                disabled={readOnly}
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <input
                                                type="number"
                                                value={item.quantity}
                                                onChange={(e) => updateRow(item.id, "quantity", Number(e.target.value))}
                                                className="w-full px-2 py-1.5 rounded border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none disabled:bg-transparent disabled:border-transparent"
                                                min="0"
                                                step="1"
                                                disabled={readOnly}
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <input
                                                type="number"
                                                value={item.unitPrice}
                                                onChange={(e) => updateRow(item.id, "unitPrice", Number(e.target.value))}
                                                className="w-full px-2 py-1.5 rounded border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none disabled:bg-transparent disabled:border-transparent"
                                                min="0"
                                                step="0.01"
                                                disabled={readOnly}
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="px-2 py-1.5 bg-slate-50 rounded text-slate-700 font-medium">
                                                ${item.total.toFixed(2)}
                                            </div>
                                        </td>
                                        {!readOnly && (
                                            <td className="px-4 py-3">
                                                <button
                                                    type="button"
                                                    onClick={() => removeRow(item.id)}
                                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                                    title="Delete item"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex justify-end">
                <div className="w-64 space-y-2 text-sm">
                    <div className="flex justify-between py-1">
                        <span className="text-slate-600">Subtotal:</span>
                        <span className="font-semibold text-slate-900">${subtotal.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
