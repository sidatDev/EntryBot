"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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
import { Plus, Check, Loader2 } from "lucide-react";
import { createUser } from "@/lib/actions";
import { useRouter } from "next/navigation";

// Define interface for Organizations
interface Organization {
    id: string;
    name: string;
}

interface AddUserModalProps {
    customRoles: Role[];
    organizations: Organization[];
}

export function AddUserModal({ customRoles, organizations }: AddUserModalProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
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
        setError("");

        // Validation
        if (formData.password !== formData.confirmPassword) {
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
            setOpen(false);
            router.refresh();
            // Reset form
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
        } catch (err: any) {
            setError(err.message || "Failed to create user");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-indigo-600 hover:bg-indigo-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Add New User
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add New User</DialogTitle>
                    <DialogDescription>
                        Create a new user profile and assign their role.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    {error && (
                        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                            id="name"
                            name="name"
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
                            <SelectTrigger>
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

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create User
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
