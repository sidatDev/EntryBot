"use client";

import { FileText, Clock, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function ChildClientView({ organizationId }: { organizationId: string }) {
    return (
        <div className="space-y-6">
            <div className="bg-blue-600 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
                <div className="relative z-10">
                    <h2 className="text-3xl font-bold mb-2">Welcome back!</h2>
                    <p className="text-blue-100 max-w-xl mb-6">
                        You have 3 documents pending review. Your team processed 45 documents this week.
                    </p>
                    <Link
                        href="/documents"
                        className="inline-flex items-center gap-2 bg-white text-blue-600 px-5 py-2.5 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                    >
                        <FileText size={18} />
                        View Documents
                    </Link>
                </div>
                {/* Decorative circle */}
                <div className="absolute -right-10 -bottom-20 w-64 h-64 bg-blue-500 rounded-full opacity-50 blur-3xl"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4 mb-3">
                        <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
                            <Clock size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Processing</p>
                            <h4 className="text-xl font-bold text-gray-900">12 Files</h4>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4 mb-3">
                        <div className="p-3 bg-red-100 text-red-600 rounded-xl">
                            <AlertCircle size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Needs Attention</p>
                            <h4 className="text-xl font-bold text-gray-900">3 Files</h4>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4 mb-3">
                        <div className="p-3 bg-green-100 text-green-600 rounded-xl">
                            <FileText size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Completed (This Month)</p>
                            <h4 className="text-xl font-bold text-gray-900">145 Files</h4>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
