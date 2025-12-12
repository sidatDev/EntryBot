"use client";

import { useState } from "react";
import { IntegrationTabs } from "@/components/integration/IntegrationTabs";
import { IntegrationConnectors } from "@/components/integration/IntegrationConnectors";
import { IntegrationStatus } from "@/components/integration/IntegrationStatus";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

export default function IntegrationDataPage() {
    const [activeTab, setActiveTab] = useState("integration");
    const [connectionStatus, setConnectionStatus] = useState("NONE"); // NONE, XERO, QUICKBOOKS, API

    const handleConnect = (platform: string) => {
        // Placeholder for connection logic
        console.log(`Connecting to ${platform}...`);
        setConnectionStatus(platform);
    };

    return (
        <div className="flex flex-col gap-6 h-full p-8 max-w-7xl mx-auto w-full">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Integration Data</h1>
                <p className="text-slate-500">Manage your accounting software connections and sync settings.</p>
            </div>

            <IntegrationTabs activeTab={activeTab} onTabChange={setActiveTab} />

            <div className="mt-2 space-y-6">
                {activeTab === "integration" && (
                    <div className="space-y-6">
                        <IntegrationStatus status={connectionStatus} />

                        <div>
                            <h2 className="text-lg font-semibold mb-3">Available Connectors</h2>
                            <IntegrationConnectors
                                onConnect={handleConnect}
                                currentConnection={connectionStatus}
                            />
                        </div>

                        <Alert className="bg-blue-50 border-blue-200">
                            <Info className="h-4 w-4 text-blue-600" />
                            <AlertTitle className="text-blue-800">Note</AlertTitle>
                            <AlertDescription className="text-blue-700">
                                Connecting a new integration will sync your contacts and chart of accounts automatically. This process may take a few minutes.
                            </AlertDescription>
                        </Alert>
                    </div>
                )}

                {activeTab !== "integration" && (
                    <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-lg bg-slate-50">
                        <p className="text-slate-500">
                            Settings for <strong>{activeTab.replace('-', ' ')}</strong> will appear here after integration is established.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
