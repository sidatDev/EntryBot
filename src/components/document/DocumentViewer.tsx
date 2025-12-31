"use client";

import { useState } from "react";
import { ZoomIn, ZoomOut, RotateCw } from "lucide-react";

interface DocumentViewerProps {
    url: string;
    type: string;
    secondUrl?: string | null;
}

export function DocumentViewer({ url, type, secondUrl }: DocumentViewerProps) {
    const [scale, setScale] = useState(1);
    const [rotation, setRotation] = useState(0);

    const handleZoomIn = () => setScale((p) => Math.min(p + 0.2, 3));
    const handleZoomOut = () => setScale((p) => Math.max(p - 0.2, 0.5));
    const handleRotate = () => setRotation((p) => (p + 90) % 360);

    return (
        <div className="h-full flex flex-col bg-slate-100 border-l border-slate-200">
            <div className="p-2 border-b border-slate-200 bg-white flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Document Viewer
                </span>
                <div className="flex items-center gap-1">
                    <button
                        onClick={handleZoomOut}
                        className="p-1.5 hover:bg-slate-100 rounded text-slate-600"
                        title="Zoom Out"
                    >
                        <ZoomOut className="h-4 w-4" />
                    </button>
                    <span className="text-xs text-slate-500 w-12 text-center">
                        {Math.round(scale * 100)}%
                    </span>
                    <button
                        onClick={handleZoomIn}
                        className="p-1.5 hover:bg-slate-100 rounded text-slate-600"
                        title="Zoom In"
                    >
                        <ZoomIn className="h-4 w-4" />
                    </button>
                    <div className="w-px h-4 bg-slate-200 mx-1" />
                    <button
                        onClick={handleRotate}
                        className="p-1.5 hover:bg-slate-100 rounded text-slate-600"
                        title="Rotate"
                    >
                        <RotateCw className="h-4 w-4" />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-4 lg:p-8 flex bg-slate-100/50">
                <div
                    style={{
                        transform: `scale(${scale}) rotate(${rotation}deg)`,
                        transition: "transform 0.2s ease-in-out",
                    }}
                    className="shadow-xl bg-white flex flex-col gap-4 p-2 lg:p-4 m-auto origin-center"
                >
                    {type === "PDF" ? (
                        <iframe
                            src={url}
                            className="w-full lg:w-[600px] h-[500px] lg:h-[800px] bg-white"
                            title="PDF Viewer"
                        />
                    ) : (
                        <>
                            <div className="relative group">
                                <span className="absolute top-2 left-2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity pointer-events-none">Front Side</span>
                                <img
                                    src={url}
                                    alt="Document Front"
                                    className="max-w-full lg:max-w-[600px] max-h-[60vh] lg:max-h-[600px] object-contain bg-white"
                                />
                            </div>
                            {secondUrl && (
                                <div className="relative group border-t border-slate-200 pt-4">
                                    <span className="absolute top-6 left-2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity pointer-events-none">Back Side</span>
                                    <img
                                        src={secondUrl}
                                        alt="Document Back"
                                        className="max-w-full lg:max-w-[600px] max-h-[60vh] lg:max-h-[600px] object-contain bg-white"
                                    />
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
