"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, AlertCircle } from "lucide-react";

interface IntegrationStatusProps {
    status: string; // NONE, XERO, QUICKBOOKS
}

export function IntegrationStatus({ status }: IntegrationStatusProps) {
    const isConnected = status !== "NONE";

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-lg font-medium">Connection Status</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-3">
                    {isConnected ? (
                        <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="h-6 w-6 text-green-600" />
                        </div>
                    ) : (
                        <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center">
                            <AlertCircle className="h-6 w-6 text-slate-500" />
                        </div>
                    )}

                    <div>
                        <p className="font-medium text-slate-900">
                            {status === "NONE" ? "No Active Integration" : `Connected to ${status}`}
                        </p>
                        <p className="text-sm text-slate-500">
                            {status === "NONE"
                                ? "Connect an accounting platform to sync your data automatically."
                                : "Your accounting data is being synced automatically."}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
