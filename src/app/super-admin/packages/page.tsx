import Link from "next/link";
import { getPackages } from "@/lib/actions/packages";
import { Plus } from "lucide-react";

export default async function PackagesPage() {
    const packages = await getPackages();

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Subscription Packages</h1>
                    <p className="text-gray-500">Manage pricing tiers and credit limits.</p>
                </div>
                <Link
                    href="/super-admin/packages/new"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
                >
                    <Plus size={20} />
                    Create Package
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {packages.map((pkg) => (
                    <div key={pkg.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xl font-bold text-gray-900">{pkg.name}</h3>
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                ACTIVE
                            </span>
                        </div>

                        <div className="mb-6">
                            <span className="text-3xl font-bold">${pkg.price}</span>
                            <span className="text-gray-500"> / month</span>
                        </div>

                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Credits Included</span>
                                <span className="font-medium">{pkg.monthlyCredits.toLocaleString()}</span>
                            </div>
                            {pkg.description && (
                                <p className="text-sm text-gray-600 border-t pt-3">
                                    {pkg.description}
                                </p>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 text-gray-700">
                                Edit
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
