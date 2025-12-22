import { getOrganizations } from '@/lib/actions/organization';
import Link from 'next/link';

export default async function OrganizationsPage() {
    const { success, data: organizations, error } = await getOrganizations("MASTER_CLIENT");

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Organizations</h1>
                    <p className="text-gray-500">Manage Master Clients and their accounts</p>
                </div>
                <Link
                    href="/super-admin/organizations/new"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                    <span className="text-xl">+</span> Add Master Client
                </Link>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg">
                    Error loading organizations: {error}
                </div>
            )}

            <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Name</th>
                            <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Type</th>
                            <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Status</th>
                            <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Sub-Accounts</th>
                            <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Users</th>
                            <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Created</th>
                            <th className="px-6 py-4 font-semibold text-gray-600 text-sm text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {organizations?.map((org) => (
                            <tr key={org.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div className="font-medium text-gray-900">{org.name}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                                        ${org.type === 'MASTER_CLIENT' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {org.type.replace('_', ' ')}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                                        ${org.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        {org.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-gray-500">
                                    {org._count.children}
                                </td>
                                <td className="px-6 py-4 text-gray-500">
                                    {org._count.users}
                                </td>
                                <td className="px-6 py-4 text-gray-500 text-sm">
                                    {new Date(org.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <Link
                                        href={`/super-admin/organizations/${org.id}`}
                                        className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                                    >
                                        Manage
                                    </Link>
                                </td>
                            </tr>
                        ))}

                        {(!organizations || organizations.length === 0) && (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                    No organizations found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
