import { Sidebar } from "@/components/layout/Sidebar";
import { TopHeader } from "@/components/dashboard/TopHeader";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { HeaderAlert } from "@/components/layout/HeaderAlert";
import { prisma } from "@/lib/prisma";
import { getOwnerOrganizations } from "@/lib/actions";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
        redirect("/login");
    }

    // Check if new Master Client needs onboarding
    if (session.user.role === "CLIENT") {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { ownedOrganizations: true }
        });

        if (user && user.ownedOrganizations.length === 0) {
            redirect("/onboarding");
        }
    }

    // CLIENT LOGIC: Fetch Owned Orgs for Switcher
    let ownedOrgs: any[] = [];
    if (session.user.role === "CLIENT") {
        try {
            ownedOrgs = await getOwnerOrganizations();
        } catch (e) {
            console.error("Failed to load client orgs", e);
        }
    }

    return (
        <div className="min-h-screen bg-slate-50/50">
            <Sidebar />
            <main className="lg:pl-64 min-h-screen flex flex-col bg-slate-50/50 transition-all duration-300">
                <TopHeader
                    userRole={session.user.role}
                    ownedOrgs={ownedOrgs}
                />
                <HeaderAlert />
                <div className="mx-auto p-4 md:p-6 lg:p-8 w-full">
                    {children}
                </div>
            </main>
        </div>
    );
}
