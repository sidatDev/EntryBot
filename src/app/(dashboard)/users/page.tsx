import { getUsers, getRoles } from "@/lib/actions";
import { UserListTable } from "@/components/users/UserListTable";
import { AddUserModal } from "@/components/users/AddUserModal";

export default async function UsersPage({
    searchParams
}: {
    searchParams: Promise<{ search?: string }>;
}) {
    const { search } = await searchParams;
    const users = await getUsers(search);
    const roles = await getRoles();

    // Map roles for the modal
    const customRoles = roles.map(r => ({ id: r.id, name: r.name }));

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold text-slate-800">User Management</h1>
                <p className="text-slate-500">Manage system users, assign roles, and control access.</p>
            </div>

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {/* Simple Search Stub - Ideally we make a Client Component for this or use a Form */}
                    <form className="relative">
                        <input
                            name="search"
                            defaultValue={search}
                            placeholder="Search users..."
                            className="pl-3 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
                        />
                    </form>
                </div>
                <AddUserModal customRoles={customRoles} />
            </div>

            <UserListTable users={users} customRoles={customRoles} />
        </div>
    );
}
