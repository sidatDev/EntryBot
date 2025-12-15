"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Save, Loader2 } from "lucide-react";
import { updateUser } from "@/lib/actions";
import { useRouter } from "next/navigation";

interface Role {
    id: string;
    name: string;
}

interface User {
    id: string;
    name: string | null;
    email: string;
    role: string;
    status: string;
    customRole?: { id: string; name: string } | null;
}

interface EditUserModalProps {
    user: User;
    customRoles: Role[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditUserModal({ user, customRoles, open, onOpenChange }: EditUserModalProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        name: user.name || "",
        email: user.email,
        role: user.customRole ? "CUSTOM" : user.role,
        customRoleId: user.customRole?.id || "",
        status: user.status === "ACTIVE",
        password: "",
        confirmPassword: ""
    });

    // Reset form when user changes
    useEffect(() => {
        setFormData({
            name: user.name || "",
            email: user.email,
            role: user.customRole ? "CUSTOM" : user.role,
            customRoleId: user.customRole?.id || "",
            status: user.status === "ACTIVE",
            password: "",
            confirmPassword: ""
        });
        setError("");
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleRoleChange = (val: string) => {
        if (val === "ADMIN" || val === "CLIENT") {
            setFormData(prev => ({ ...prev, role: val, customRoleId: "" }));
        } else {
            setFormData(prev => ({ ...prev, role: "CUSTOM", customRoleId: val }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // Validation for password if provided
        if (formData.password) {
            if (formData.password !== formData.confirmPassword) {
                setError("Passwords do not match");
                return;
            }
            if (formData.password.length < 8) {
                setError("Password must be at least 8 characters");
                return;
            }
        }

        setIsLoading(true);
        try {
            await updateUser(user.id, {
                name: formData.name,
                email: formData.email,
                role: formData.role,
                customRoleId: formData.customRoleId,
                status: formData.status ? "ACTIVE" : "INACTIVE",
                ...(formData.password && { password: formData.password })
            });
            onOpenChange(false);
            router.refresh();
        } catch (err: any) {
            setError(err.message || "Failed to update user");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit User</DialogTitle>
                    <DialogDescription>
                        Update user information and permissions.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    {error && (
                        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="edit-name">Full Name</Label>
                        <Input
                            id="edit-name"
                            name="name"
                            required
                            minLength={3}
                            value={formData.name}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="edit-email">Email Address</Label>
                        <Input
                            id="edit-email"
                            name="email"
                            type="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Assign Role</Label>
                        <Select
                            value={formData.customRoleId || formData.role}
                            onValueChange={handleRoleChange}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ADMIN">Admin (Full Access)</SelectItem>
                                <SelectItem value="CLIENT">Client (Standard Access)</SelectItem>
                                {customRoles.map(role => (
                                    <SelectItem key={role.id} value={role.id}>
                                        {role.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2 pt-2 border-t">
                        <Label className="text-sm font-semibold">Change Password (Optional)</Label>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-password">New Password</Label>
                                <Input
                                    id="edit-password"
                                    name="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Leave blank to keep"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-confirmPassword">Confirm</Label>
                                <Input
                                    id="edit-confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="edit-status"
                                checked={formData.status}
                                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, status: checked }))}
                            />
                            <Label htmlFor="edit-status">Active User</Label>
                        </div>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
