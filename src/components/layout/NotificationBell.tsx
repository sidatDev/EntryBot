"use client";

import { useState } from "react";
import { Bell } from "lucide-react";

export default function NotificationBell() {
    const [open, setOpen] = useState(false);

    // Mock Notifications
    const [notifications, setNotifications] = useState([
        { id: 1, title: "Document Processed", message: "INV-2024-001 has been processed.", time: "2 mins ago", read: false },
        { id: 2, title: "Credits Low", message: "You have used 80% of your monthly credits.", time: "1 hour ago", read: false },
        { id: 3, title: "Welcome", message: "Welcome to EntryBot! Complete your profile.", time: "1 day ago", read: true }
    ]);

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                )}
            </button>

            {open && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpen(false)}></div>
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                            <h3 className="font-semibold text-gray-900">Notifications</h3>
                            <button className="text-xs text-blue-600 font-medium hover:underline">Mark all read</button>
                        </div>
                        <div className="max-h-[300px] overflow-y-auto divide-y divide-gray-50">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-gray-400 text-sm">No notifications</div>
                            ) : (
                                notifications.map(n => (
                                    <div key={n.id} className={`p-4 hover:bg-gray-50 transition-colors ${n.read ? 'opacity-60' : 'bg-blue-50/30'}`}>
                                        <div className="flex justify-between items-start mb-1">
                                            <p className={`text-sm ${n.read ? 'font-medium text-gray-700' : 'font-bold text-gray-900'}`}>{n.title}</p>
                                            <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">{n.time}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 line-clamp-2">{n.message}</p>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="p-2 border-t border-gray-100 text-center">
                            <button className="text-xs text-gray-500 hover:text-gray-900 font-medium w-full py-1">View All Activity</button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
