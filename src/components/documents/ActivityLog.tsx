"use client";

import { useEffect, useState } from "react";
import { getDocumentActivities } from "@/lib/actions/activity";
import { format } from "date-fns";
import { Loader2, User, FileText, CheckCircle, XCircle, Edit, Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ActivityLog({ documentId }: { documentId: string }) {
    const [activities, setActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchLogs() {
            setLoading(true);
            const res = await getDocumentActivities(documentId);
            if (res.success && res.activities) {
                setActivities(res.activities);
            }
            setLoading(false);
        }
        fetchLogs();
    }, [documentId]);

    const getIcon = (action: string) => {
        switch (action) {
            case "UPLOAD": return <Upload className="h-4 w-4 text-blue-500" />;
            case "EDIT": return <Edit className="h-4 w-4 text-orange-500" />;
            case "APPROVAL": return <CheckCircle className="h-4 w-4 text-green-500" />;
            case "STATUS_CHANGE": return <FileText className="h-4 w-4 text-purple-500" />;
            case "ASSIGN": return <User className="h-4 w-4 text-indigo-500" />;
            default: return <FileText className="h-4 w-4 text-gray-500" />;
        }
    };

    if (loading) {
        return <div className="flex justify-center p-4"><Loader2 className="animate-spin h-5 w-5 text-gray-400" /></div>;
    }

    if (activities.length === 0) {
        return <div className="text-sm text-gray-500 text-center p-4">No activity recorded yet.</div>;
    }

    return (
        <Card className="mt-6">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium">Activity Log</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-y-auto pr-4">
                    <div className="space-y-4">
                        {activities.map((log) => (
                            <div key={log.id} className="flex gap-3 text-sm">
                                <div className="mt-0.5 bg-gray-100 p-1.5 rounded-full h-fit">
                                    {getIcon(log.action)}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <span className="font-semibold text-gray-900">
                                            {log.user?.name || "System"}
                                        </span>
                                        <span className="text-xs text-gray-500 tabular-nums">
                                            {format(new Date(log.createdAt), "MMM d, h:mm a")}
                                        </span>
                                    </div>
                                    <p className="text-gray-600 mt-0.5">{log.details || log.action}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
