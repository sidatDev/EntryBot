"use client";

import { useState } from "react";
import { Package, Plus } from "lucide-react";
import { PlaceOrderModal } from "./PlaceOrderModal";

export function PlaceOrderWrapper() {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
                <Package size={18} />
                Place Order
            </button>

            <PlaceOrderModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => {
                    window.location.reload(); // Refresh to show updated stats
                }}
            />
        </>
    );
}
