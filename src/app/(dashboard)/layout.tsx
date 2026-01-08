import { Sidebar } from "@/components/layout/Sidebar";
import { TopHeader } from "@/components/dashboard/TopHeader";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { HeaderAlert } from "@/components/layout/HeaderAlert";
import { prisma } from "@/lib/prisma";

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
            include: { ownedOrganizations: true } // This field triggers the error if client is not generated
        });

        if (user && user.ownedOrganizations.length === 0) {
            redirect("/onboarding");
        }
    }

    return (
        <div className="min-h-screen bg-slate-50/50">
            <Sidebar /> {/* Desktop Sidebar (hidden on mobile via internal logic) */}
            <main className="lg:pl-64 min-h-screen flex flex-col bg-slate-50/50 transition-all duration-300">
                <TopHeader />
                <HeaderAlert />
                <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 w-full">
                    {children}
                </div>
            </main>
        </div>
    );
}
