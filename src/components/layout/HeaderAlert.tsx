"use client";

import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";
import { useSession } from "next-auth/react";

export function HeaderAlert() {
    const [isVisible, setIsVisible] = useState(true);
    const { data: session } = useSession();
    if (!isVisible) return null;

    return (
        // <div className="bg-orange-50 border-b border-orange-100 px-4 py-2">
        //     <div className="max-w-7xl mx-auto flex items-center justify-between text-sm">
        //         <div className="flex items-center gap-2 text-orange-700">
        //             <AlertTriangle className="h-4 w-4" />
        //             <p>
        //                 A verification email has been sent to <span className="font-semibold">{session?.user?.email || "user@example.com"}</span>. Please check your email and complete email verification.
        //             </p>
        //         </div>
        //         <div className="flex items-center gap-2">
        //             <button className="px-3 py-1 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors text-xs font-medium">
        //                 Resend
        //             </button>
        //             <button className="px-3 py-1 bg-white border border-orange-200 text-orange-700 rounded hover:bg-orange-50 transition-colors text-xs font-medium">
        //                 Change
        //             </button>
        //             <button
        //                 onClick={() => setIsVisible(false)}
        //                 className="ml-2 text-orange-400 hover:text-orange-600"
        //             >
        //                 <X className="h-4 w-4" />
        //             </button>
        //         </div>
        //     </div>
        // </div>
        null
    );
}
