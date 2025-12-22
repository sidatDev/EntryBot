"use client";

import { useState } from "react";
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
import { Loader2 } from "lucide-react";
import { createUser } from "@/lib/actions";
import { useRouter } from "next/navigation";

interface Organization {
    id: string;
    name: string;
}

interface UserFormProps {
    customRoles: { id: string; name: string }[];
    organizations: Organization[];
    onSuccess?: () => void;
    onCancel?: () => void;
}

export function UserForm({ customRoles, organizations, onSuccess, onCancel }: UserFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "CLIENT", // Default
        customRoleId: "",
        organizationId: "",
        status: true, // true = ACTIVE
        sendWelcomeEmail: true
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value
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
        console.log("Submit triggered", formData);
        setError("");

        // Validation
        if (formData.password !== formData.confirmPassword) {
            console.log("Password mismatch detected");
            setError("Passwords do not match");
            return;
        }
        if (formData.password.length < 8) {
            setError("Password must be at least 8 characters");
            return;
        }

        setIsLoading(true);
        try {
            await createUser({
                name: formData.name,
                email: formData.email,
                password: formData.password,
                role: formData.role,
                customRoleId: formData.customRoleId,
                organizationId: formData.organizationId,
                status: formData.status ? "ACTIVE" : "INACTIVE",
                sendWelcomeEmail: formData.sendWelcomeEmail
            });
            router.refresh();
            setFormData({
                name: "",
                email: "",
                password: "",
                confirmPassword: "",
                role: "CLIENT",
                customRoleId: "",
                organizationId: "",
                status: true,
                sendWelcomeEmail: true
            });
            onSuccess?.();
        } catch (err: any) {
            setError(err.message || "Failed to create user");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 py-4" data-testid="user-form">
            {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md" data-testid="error-message">
                    {error}
                </div>
            )}

            <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                    id="name"
                    name="name"
                    data-testid="input-name"
                    required
                    minLength={3}
                    value={formData.name}
                    onChange={handleChange}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                    id="email"
                    name="email"
                    data-testid="input-email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="password">Initial Password *</Label>
                    <Input
                        id="password"
                        name="password"
                        data-testid="input-password"
                        type="password"
                        required
                        value={formData.password}
                        onChange={handleChange}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm *</Label>
                    <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        data-testid="input-confirm"
                        type="password"
                        required
                        value={formData.confirmPassword}
                        onChange={handleChange}
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label>Organization</Label>
                <Select
                    value={formData.organizationId}
                    onValueChange={(val) => setFormData(prev => ({ ...prev, organizationId: val }))}
                >
                    <SelectTrigger data-testid="select-org">
                        <SelectValue placeholder="Select Organization (Optional)" />
                    </SelectTrigger>
                    <SelectContent>
                        {organizations.map(org => (
                            <SelectItem key={org.id} value={org.id}>
                                {org.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label>Assign Role *</Label>
                <Select
                    value={formData.customRoleId || formData.role}
                    onValueChange={handleRoleChange}
                >
                    <SelectTrigger data-testid="select-role">
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

            <div className="flex items-center justify-between pt-2">
                <div className="flex items-center space-x-2">
                    <Switch
                        id="status"
                        checked={formData.status}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, status: checked }))}
                    />
                    <Label htmlFor="status">Active User</Label>
                </div>

                <div className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        id="welcome"
                        className="rounded border-slate-300"
                        checked={formData.sendWelcomeEmail}
                        onChange={(e) => setFormData(prev => ({ ...prev, sendWelcomeEmail: e.target.checked }))}
                    />
                    <Label htmlFor="welcome" className="font-normal text-sm">Send Email</Label>
                </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isLoading} data-testid="submit-btn">
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create User
                </Button>
            </div>
        </form>
    );
}
