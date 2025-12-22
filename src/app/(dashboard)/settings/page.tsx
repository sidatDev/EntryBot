"use client";

import { useState } from "react";
import { User, CreditCard, Users, Settings as SettingsIcon } from "lucide-react";
import { useSession } from "next-auth/react";
import AuditLogViewer from "@/components/audit/AuditLogViewer";

// Placeholder components
function ProfileTab() {
    const { data: session } = useSession();
    return (
        <div className="bg-white p-6 rounded-xl border border-gray-200">
            <h2 className="text-xl font-bold mb-4">My Profile</h2>
            <div className="grid grid-cols-2 gap-4 max-w-md">
                <div>
                    <label className="block text-sm font-medium text-gray-500">Name</label>
                    <div className="mt-1 p-2 bg-gray-50 rounded border">{session?.user?.name}</div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-500">Email</label>
                    <div className="mt-1 p-2 bg-gray-50 rounded border">{session?.user?.email}</div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-500">Role</label>
                    <div className="mt-1 p-2 bg-gray-50 rounded border">{session?.user?.role}</div>
                </div>
            </div>
        </div>
    );
}

function SubscriptionTab() {
    return (
        <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-xl font-bold">My Subscription</h2>
                    <p className="text-gray-500">Manage your plan and usage.</p>
                </div>
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">Active</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="text-sm text-blue-600 font-medium mb-1">Current Plan</div>
                    <div className="text-2xl font-bold text-gray-900">Silver Package</div>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                    <div className="text-sm text-purple-600 font-medium mb-1">Remaining Credits</div>
                    <div className="text-2xl font-bold text-gray-900">1,250 / 2,000</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="text-sm text-gray-600 font-medium mb-1">Renewal Date</div>
                    <div className="text-2xl font-bold text-gray-900">Jan 12, 2026</div>
                </div>
            </div>

            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Upgrade Plan
            </button>
        </div>
    );
}

function TeamTab() {
    return (
        <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold">Team Management</h2>
                    <p className="text-gray-500">Manage members and permissions.</p>
                </div>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
                    <Users size={16} />
                    Invite Member
                </button>
            </div>

            <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-medium border-b">
                        <tr>
                            <th className="px-4 py-3">Name</th>
                            <th className="px-4 py-3">Role</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        <tr>
                            <td className="px-4 py-3 font-medium">Alice Admin</td>
                            <td className="px-4 py-3">Manager</td>
                            <td className="px-4 py-3"><span className="text-green-600">Active</span></td>
                            <td className="px-4 py-3 text-blue-600 cursor-pointer">Edit</td>
                        </tr>
                        <tr>
                            <td className="px-4 py-3 font-medium">Bob Entry</td>
                            <td className="px-4 py-3">Data Entry</td>
                            <td className="px-4 py-3"><span className="text-green-600">Active</span></td>
                            <td className="px-4 py-3 text-blue-600 cursor-pointer">Edit</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default function SettingsPage() {
    const { data: session } = useSession();
    const [activeTab, setActiveTab] = useState("profile");

    const tabs = [
        { id: "profile", label: "Profile", icon: User },
        { id: "subscription", label: "Subscription", icon: CreditCard },
        { id: "team", label: "Team Members", icon: Users },
        { id: "general", label: "General", icon: SettingsIcon },
    ];

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar Navigation */}
                <div className="w-full md:w-64 flex-shrink-0">
                    <nav className="space-y-1">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === tab.id
                                        ? "bg-blue-50 text-blue-700"
                                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                        }`}
                                >
                                    <Icon size={18} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Content Area */}
                <div className="flex-1">
                    {activeTab === "profile" && <ProfileTab />}
                    {activeTab === "subscription" && <SubscriptionTab />}
                    {activeTab === "team" && <TeamTab />}

                    {activeTab === "general" && (
                        <div className="space-y-6">
                            <div className="bg-white p-6 rounded-xl border border-gray-200">
                                <h3 className="text-xl font-bold mb-4">General Settings</h3>
                                <p className="text-gray-500">Organization details and preferences.</p>
                                {/* Settings forms would go here */}
                            </div>

                            {/* Audit Log Section */}
                            {(session?.user as any)?.organizationId && (
                                <AuditLogViewer organizationId={(session?.user as any).organizationId} />
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
