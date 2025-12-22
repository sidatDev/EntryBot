"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { UploadModal } from "@/components/upload/UploadModal";
import Link from "next/link";
import { FileText, ArrowRight } from "lucide-react";

interface StatusWidgetProps {
    title: string;
    description: string;
    processedCount: number;
    totalCount?: number;
    uploadCategory: "SALES" | "PURCHASE" | "GENERAL" | "STATEMENT" | "OTHER" | undefined;
    viewLink: string;
    colors: [string, string]; // [Completed, Remaining/Bg]
}

export function StatusWidget({ title, description, processedCount, totalCount = 100, uploadCategory, viewLink, colors }: StatusWidgetProps) {
    // Simple data for donut: Processed vs Remaining vs Mock Total
    const data = [
        { name: "Processed", value: processedCount },
        { name: "Remaining", value: Math.max(0, totalCount - processedCount) },
    ];

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
            <div className="mb-4">
                <h3 className="text-lg font-bold text-slate-800">{title}</h3>
                <p className="text-xs text-slate-500 mt-1">{description}</p>
            </div>

            <div className="flex items-center justify-center h-40 relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            innerRadius={45}
                            outerRadius={60}
                            paddingAngle={5}
                            dataKey="value"
                            startAngle={90}
                            endAngle={-270}
                        >
                            <Cell key="processed" fill={colors[0]} />
                            <Cell key="remaining" fill={colors[1]} />
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-bold text-slate-800">{processedCount}</span>
                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Processing</span>
                </div>
            </div>

            <div className="mt-auto gap-3 pt-4 border-t border-slate-100">
                {/* Upload Button */}
                <div className="col-span-1">
                    {/* We might need to adjust UploadModal to fit in small button or just wrap it */}
                    <UploadModal category={uploadCategory} />
                </div>

                {/* View Data Button */}
                <Link
                    href={viewLink}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-semibold transition-colors"
                >
                    View Data <ArrowRight className="h-3 w-3" />
                </Link>
            </div>
        </div>
    );
}
