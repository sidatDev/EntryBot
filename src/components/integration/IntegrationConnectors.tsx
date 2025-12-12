"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";

interface IntegrationConnectorsProps {
    onConnect: (platform: string) => void;
    currentConnection: string;
}

export function IntegrationConnectors({ onConnect, currentConnection }: IntegrationConnectorsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Xero */}
            <Card className={`cursor-pointer transition-all hover:border-blue-500 ${currentConnection === 'XERO' ? 'ring-2 ring-blue-500 border-transparent' : ''}`} onClick={() => onConnect('XERO')}>
                <CardContent className="p-6 flex flex-col items-center justify-center gap-4 text-center h-full">
                    <div className="h-12 w-12 bg-[#0C121C] rounded-lg flex items-center justify-center text-white font-bold text-xl">
                        X
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-900">Xero</h3>
                        <p className="text-xs text-slate-500 mt-1">Connect to Xero Accounting</p>
                    </div>
                    <Button variant={currentConnection === 'XERO' ? "secondary" : "default"} className="w-full mt-2">
                        {currentConnection === 'XERO' ? "Connected" : "Connect"}
                    </Button>
                </CardContent>
            </Card>

            {/* QuickBooks */}
            <Card className={`cursor-pointer transition-all hover:border-green-500 ${currentConnection === 'QUICKBOOKS' ? 'ring-2 ring-green-500 border-transparent' : ''}`} onClick={() => onConnect('QUICKBOOKS')}>
                <CardContent className="p-6 flex flex-col items-center justify-center gap-4 text-center h-full">
                    <div className="h-12 w-12 bg-[#2CA01C] rounded-lg flex items-center justify-center text-white font-bold text-xl">
                        QB
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-900">QuickBooks</h3>
                        <p className="text-xs text-slate-500 mt-1">Connect to QuickBooks Online</p>
                    </div>
                    <Button variant={currentConnection === 'QUICKBOOKS' ? "secondary" : "default"} className="w-full mt-2">
                        {currentConnection === 'QUICKBOOKS' ? "Connected" : "Connect"}
                    </Button>
                </CardContent>
            </Card>

            {/* API / Custom */}
            <Card className={`cursor-pointer transition-all hover:border-purple-500 ${currentConnection === 'API' ? 'ring-2 ring-purple-500 border-transparent' : ''}`} onClick={() => onConnect('API')}>
                <CardContent className="p-6 flex flex-col items-center justify-center gap-4 text-center h-full">
                    <div className="h-12 w-12 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                        API
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-900">Custom API</h3>
                        <p className="text-xs text-slate-500 mt-1">Connect via Custom Integration</p>
                    </div>
                    <Button variant={currentConnection === 'API' ? "secondary" : "default"} className="w-full mt-2">
                        {currentConnection === 'API' ? "Connected" : "Connect"}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
