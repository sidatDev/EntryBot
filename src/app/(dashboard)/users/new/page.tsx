
import { getRoles } from "@/lib/actions";
import { getOrganizations } from "@/lib/actions/organization";
import { UserForm } from "@/components/users/UserForm";

export default async function CreateUserPage({
    searchParams
}: {
    searchParams: Promise<{ orgId?: string }>;
}) {
    const { orgId } = await searchParams;
    const roles = await getRoles();
    const { data: organizations } = await getOrganizations();

    // Map roles for the form
    const customRoles = roles.map(r => ({ id: r.id, name: r.name }));
    const orgOptions = organizations?.map(o => ({ id: o.id, name: o.name })) || [];

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Add New User</h1>
                <p className="text-slate-500">Create a profile for a new team member or client.</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
                <UserForm
                    customRoles={customRoles}
                    organizations={orgOptions}
                    initialOrganizationId={orgId}
                    redirectOnSuccess={orgId ? `/super-admin/organizations/${orgId}` : "/users"}
                />
            </div>
        </div>
    );
}
