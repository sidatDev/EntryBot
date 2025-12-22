import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopHeader } from "@/components/dashboard/TopHeader";

export default async function SuperAdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getServerSession(authOptions);

    // Basic permission check - expand later
    if (session?.user?.role !== "SUPER_ADMIN" && session?.user?.role !== "ADMIN") {
        redirect("/dashboard");
    }

    return (
        <div className="flex bg-gray-50 min-h-screen">
            {/* Reusing existing Sidebar for now - logic inside Sidebar needs to handle Admin links */}
            <div className="hidden md:flex w-64 flex-col fixed inset-y-0 z-50">
                <Sidebar />
            </div>
            <div className="flex-1 flex flex-col md:pl-64">
                <TopHeader />
                <main className="flex-1 p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
