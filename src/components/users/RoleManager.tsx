"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Trash2, Edit, Save, Plus } from "lucide-react";
import { createRole, updateRole, deleteRole } from "@/lib/actions";
import { useRouter } from "next/navigation";

// Defined permissions based on documentation
const PERMISSION_GROUPS = [
    { name: "Dashboard", key: "dashboard", permissions: ["view"] },
    { name: "Invoices & Receipts", key: "invoices", permissions: ["view", "upload", "approve", "export"] },
    { name: "Bank & Card Statements", key: "bank", permissions: ["view", "upload", "bulk_edit", "export"] },
    { name: "Other Documents", key: "other", permissions: ["view", "upload", "tagging", "edit_properties"] },
    { name: "Upload History", key: "history", permissions: ["view"] },
    { name: "Recycle Bin", key: "recycle", permissions: ["view", "restore", "permanent_delete"] },
    { name: "Integration Data", key: "integration", permissions: ["view", "edit"] },
    { name: "User Management", key: "users", permissions: ["view", "create_edit"] },
    { name: "Role Management", key: "roles", permissions: ["view", "create_edit"] },
];

interface Role {
    id: string;
    name: string;
    permissions: string; // JSON string
}

interface RoleManagerProps {
    roles: Role[];
}

export function RoleManager({ roles }: RoleManagerProps) {
    const router = useRouter();
    const [isCreating, setIsCreating] = useState(false);
    const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
    const [roleName, setRoleName] = useState("");
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleCreateStart = () => {
        setIsCreating(true);
        setEditingRoleId(null);
        setRoleName("");
        setSelectedPermissions([]);
    };

    const handleEditStart = (role: Role) => {
        setIsCreating(false);
        setEditingRoleId(role.id);
        setRoleName(role.name);
        try {
            setSelectedPermissions(JSON.parse(role.permissions));
        } catch (e) {
            setSelectedPermissions([]);
        }
    };

    const handlePermissionToggle = (permKey: string) => {
        setSelectedPermissions(prev => {
            if (prev.includes(permKey)) {
                return prev.filter(p => p !== permKey);
            } else {
                return [...prev, permKey];
            }
        });
    };

    const handleSave = async () => {
        if (!roleName) return;
        setIsLoading(true);
        try {
            if (isCreating) {
                await createRole(roleName, selectedPermissions);
            } else if (editingRoleId) {
                await updateRole(editingRoleId, selectedPermissions);
            }
            router.refresh();
            setIsCreating(false);
            setEditingRoleId(null);
        } catch (error) {
            console.error("Failed to save role", error);
            alert("Failed to save role");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (roleId: string) => {
        if (!confirm("Are you sure? This cannot be undone.")) return;
        setIsLoading(true);
        try {
            await deleteRole(roleId);
            router.refresh();
        } catch (error) {
            alert("Cannot delete role (it might be in use).");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Col: Role List */}
            <div className="bg-white rounded-lg border p-4 h-fit">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-lg">Custom Roles</h3>
                    <Button size="sm" onClick={handleCreateStart}>
                        <Plus className="h-4 w-4 mr-1" /> New
                    </Button>
                </div>
                <div className="space-y-2">
                    {roles.length === 0 && <p className="text-sm text-slate-500 italic">No custom roles defined.</p>}
                    {roles.map(role => (
                        <div
                            key={role.id}
                            onClick={() => handleEditStart(role)}
                            className={`p-3 rounded-md border cursor-pointer hover:bg-slate-50 flex items-center justify-between group ${editingRoleId === role.id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200'}`}
                        >
                            <span className="font-medium">{role.name}</span>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="opacity-0 group-hover:opacity-100 h-8 w-8 p-0 text-red-500 hover:text-red-700"
                                onClick={(e) => { e.stopPropagation(); handleDelete(role.id); }}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Col: Editor */}
            <div className="md:col-span-2 bg-white rounded-lg border p-6">
                {(isCreating || editingRoleId) ? (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold">
                                {isCreating ? "Create New Role" : `Edit Role: ${roleName}`}
                            </h3>
                            <div className="space-x-2">
                                <Button variant="outline" onClick={() => { setIsCreating(false); setEditingRoleId(null); }}>Cancel</Button>
                                <Button onClick={handleSave} disabled={isLoading}>
                                    <Save className="h-4 w-4 mr-2" />
                                    Save Role
                                </Button>
                            </div>
                        </div>

                        {isCreating && (
                            <div className="space-y-2">
                                <Label>Role Name</Label>
                                <Input
                                    value={roleName}
                                    onChange={(e) => setRoleName(e.target.value)}
                                    placeholder="e.g. Junior Bookkeeper"
                                />
                            </div>
                        )}

                        <div className="space-y-4">
                            <Label>Permissions</Label>
                            <div className="grid gap-4 border rounded-lg p-4 max-h-[500px] overflow-y-auto">
                                {PERMISSION_GROUPS.map(group => (
                                    <div key={group.key} className="pb-4 border-b last:border-0">
                                        <h4 className="font-semibold text-sm mb-3 text-slate-700">{group.name}</h4>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                            {group.permissions.map(perm => {
                                                const permKey = `${group.key}.${perm}`;
                                                return (
                                                    <div key={permKey} className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id={permKey}
                                                            checked={selectedPermissions.includes(permKey)}
                                                            onCheckedChange={() => handlePermissionToggle(permKey)}
                                                        />
                                                        <Label htmlFor={permKey} className="font-normal text-xs cursor-pointer">
                                                            {perm.replace('_', ' ').toUpperCase()}
                                                        </Label>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 p-12">
                        <Shield className="h-12 w-12 mb-4 opacity-50" />
                        <p>Select a role to edit or create a new one.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

import { Shield } from "lucide-react";
