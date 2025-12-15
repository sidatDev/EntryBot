import { getRoles } from "@/lib/actions";
import { RoleManager } from "@/components/users/RoleManager";

export default async function RolesPage() {
    const roles = await getRoles();

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold text-slate-800">Role Management</h1>
                <p className="text-slate-500">Define custom roles and granular permissions.</p>
            </div>

            <RoleManager roles={roles} />
        </div>
    );
}
