"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { createOrganization } from "@/lib/actions/organization";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function CreateOrgForm() {
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const result = await createOrganization(name, "MASTER_CLIENT"); // Default to Master Client for first org? Or just generic
            if (result.success) {
                toast.success("Organization created successfully! Redirecting...");
                router.push("/hub");
                router.refresh();
            } else {
                toast.error(result.error || "Failed to create organization");
            }
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form className="mt-8 space-y-6 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10" onSubmit={handleSubmit}>
            <div className="space-y-4">
                <div>
                    <Label htmlFor="orgName">Organization Name</Label>
                    <Input
                        id="orgName"
                        name="orgName"
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. My Company Inc."
                        className="mt-1"
                    />
                </div>
            </div>

            <div>
                <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Workspace
                </Button>
            </div>
        </form>
    );
}
