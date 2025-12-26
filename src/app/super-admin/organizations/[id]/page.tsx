import { getChildOrganizations } from '@/lib/actions/organization';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export default async function OrganizationDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const org = await prisma.organization.findUnique({
        where: { id },
        include: {
            users: true,
            _count: { select: { children: true, documents: true } }
        }
    });

    if (!org) return <div>Organization not found</div>;

    const { data: childOrgs } = await getChildOrganizations(org.id);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-2xl font-bold text-gray-900">{org.name}</h1>
                        <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full font-medium">
                            {org.type.replace('_', ' ')}
                        </span>
                    </div>
                    <p className="text-gray-500">Managing {org._count.children} sub-accounts</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border shadow-sm">
                    <div className="text-sm text-gray-500 mb-1">Credits Available</div>
                    <div className="text-2xl font-bold">{(org.credits || 0).toLocaleString()}</div>
                </div>
                <div className="bg-white p-6 rounded-xl border shadow-sm">
                    <div className="text-sm text-gray-500 mb-1">Total Documents</div>
                    <div className="text-2xl font-bold">{org._count.documents}</div>
                </div>
                <div className="bg-white p-6 rounded-xl border shadow-sm">
                    <div className="text-sm text-gray-500 mb-1">Total Users</div>
                    <div className="text-2xl font-bold">{org.users.length}</div>
                </div>
            </div>

            {/* Sub-Accounts Section */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Sub-Accounts (Child Clients)</h2>
                    <Link
                        href={`/super-admin/organizations/${org.id}/new-child`}
                        className="text-sm bg-white border border-gray-300 hover:bg-gray-50 px-3 py-1.5 rounded-lg font-medium transition-colors"
                    >
                        + Add Sub-Account
                    </Link>
                </div>

                <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-3 font-medium text-gray-600 text-sm">Name</th>
                                <th className="px-6 py-3 font-medium text-gray-600 text-sm">Status</th>
                                <th className="px-6 py-3 font-medium text-gray-600 text-sm">Docs</th>
                                <th className="px-6 py-3 font-medium text-gray-600 text-sm md:text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {childOrgs?.map((child) => (
                                <tr key={child.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium">{child.name}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium 
                                            ${child.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                            {child.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">{child._count.documents}</td>
                                    <td className="px-6 py-4 text-right">
                                        <Link href={`/super-admin/organizations/${child.id}`} className="text-blue-600 hover:underline text-sm">
                                            View
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {childOrgs?.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                        No sub-accounts created yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Users Section */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Organization Users</h2>
                    <Link
                        href={`/users/new?orgId=${org.id}`}
                        className="text-sm bg-white border border-gray-300 hover:bg-gray-50 px-3 py-1.5 rounded-lg font-medium transition-colors"
                    >
                        + Add User
                    </Link>
                </div>
                <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-3 font-medium text-gray-600 text-sm">Name</th>
                                <th className="px-6 py-3 font-medium text-gray-600 text-sm">Email</th>
                                <th className="px-6 py-3 font-medium text-gray-600 text-sm">Role</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {org.users.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">{user.name}</td>
                                    <td className="px-6 py-4 text-gray-500">{user.email}</td>
                                    <td className="px-6 py-4">
                                        <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs">
                                            {user.role}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
