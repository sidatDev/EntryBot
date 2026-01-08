import { CreateOrgForm } from "@/components/organizations/CreateOrgForm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function OnboardingPage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    // Double check if user already has an org, redirect to hub if so
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { ownedOrganizations: true }
    });

    if (user?.ownedOrganizations && user.ownedOrganizations.length > 0) {
        redirect("/hub");
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Welcome to EntryBot!
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        To get started, please create your first organization workspace.
                    </p>
                </div>
                <CreateOrgForm />
            </div>
        </div>
    );
}
