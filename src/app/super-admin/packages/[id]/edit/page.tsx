import { prisma } from "@/lib/prisma";
import { EditPackageForm } from "@/components/packages/EditPackageForm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function EditPackagePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const pkg = await prisma.package.findUnique({
        where: { id }
    });

    if (!pkg) {
        notFound();
    }

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <Link href="/super-admin/packages" className="flex items-center text-gray-500 hover:text-gray-900 mb-6">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Packages
            </Link>

            <h1 className="text-2xl font-bold mb-6">Edit Package</h1>
            <EditPackageForm pkg={pkg} />
        </div>
    );
}
