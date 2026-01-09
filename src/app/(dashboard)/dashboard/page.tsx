import { getDashboardStats } from "@/lib/actions";
import SupervisorStats from "@/components/dashboard/SupervisorStats";
import MasterClientView from "@/components/dashboard/MasterClientView";
import ChildClientView from "@/components/dashboard/ChildClientView";
import { StatusWidget } from "@/components/dashboard/StatusWidget";
import { ExpenseChart } from "@/components/dashboard/ExpenseChart";
import { BookkeepingInfo } from "@/components/dashboard/BookkeepingInfo";
import { getServerSession } from "next-auth"; // Or get current user action
import { prisma } from "@/lib/prisma"; // Direct access since page is server component
import { authOptions } from "@/lib/auth";

export default async function DashboardPage() {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) return <div>Please log in</div>;

    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            organization: true,
            ownedOrganizations: true
        }
    });

    // NEW: Operator View (Prioritize over Org Check)
    if (user?.role === "ENTRY_OPERATOR") {
        const { getDocuments } = await import("@/lib/actions");
        const { OperatorView } = await import("@/components/dashboard/OperatorView");

        // Fetch Pools
        const unclaimed = await getDocuments(undefined, "UPLOADED", undefined, true); // Unassigned
        // Note: for myQueue and completed, we pass user.id. 
        // getDocuments expects string | undefined. user.id is string.
        const myQueue = await getDocuments(undefined, "PROCESSING", user.id);
        const completed = await getDocuments(undefined, "COMPLETED", user.id);

        return (
            <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Operator Workspace</h1>
                    <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                        <span className="text-sm text-slate-500 font-medium">Online</span>
                    </div>
                </div>
                <OperatorView
                    unclaimedDocs={unclaimed}
                    myQueueDocs={myQueue}
                    completedDocs={completed}
                    currentUser={user}
                />
            </div>
        );
    }

    // Fallback: If user has no current org but owns some, switch context to first owned one
    let currentOrg = user?.organization;
    if (!currentOrg && user?.ownedOrganizations && user.ownedOrganizations.length > 0) {
        currentOrg = user.ownedOrganizations[0];
    }

    if (!currentOrg) {
        return (
            <div className="p-8 flex flex-col items-center justify-center min-h-[50vh] text-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Welcome to EntryBot</h1>
                <p className="text-gray-500 mb-8 max-w-md">
                    You don't have an organization workspace set up yet. Please check the Hub or contact support.
                </p>
                {/* Fallback link to Hub/Onboarding */}
                <a href="/hub" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                    Go to Hub
                </a>
            </div>
        );
    }

    const orgType = currentOrg.type;
    const orgId = currentOrg.id;

    // View Logic
    // View Logic
    if (orgType === "MASTER") {
        return (
            <div className="p-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Master Dashboard</h1>
                <MasterClientView organizationId={orgId} />
            </div>
        );
    }

    if (orgType === "CHILD") {
        return (
            <div className="p-8">
                <ChildClientView organizationId={orgId} />
            </div>
        );
    }

    // NEW: Manager View
    if (user.role === "MANAGER") {
        const { getUsersByRole } = await import("@/lib/actions"); // Dynamic import to avoid circular dep if needed
        const teamMembers = await getUsersByRole("ENTRY_OPERATOR");

        const { ManagerView } = await import("@/components/dashboard/ManagerView");

        return (
            <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Manager Dashboard</h1>
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold uppercase">Manager Mode</span>
                </div>
                <SupervisorStats organizationId={orgId} />
                <div className="mt-8">
                    <ManagerView teamMembers={teamMembers} />
                </div>
            </div>
        );
    }



    // Default: INTERNAL / Admin View (Existing Dashboard)
    const stats = await getDashboardStats();

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Command Center</h1>
                {/* Placeholder for date filter */}
            </div>

            {/* SUPERVISOR / ADMIN SECTION */}
            <div className="mb-8">
                <SupervisorStats organizationId={orgId} />
                {/* Note: In real app, get org ID from session */}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatusWidget
                    title="Invoices & Receipts"
                    description="Ready to export data from Invoices & Receipts"
                    processedCount={stats.invoicesReceipts.processing}
                    totalCount={stats.invoicesReceipts.processing + stats.invoicesReceipts.ready + 20} // Mock total
                    uploadCategory="GENERAL"
                    viewLink="/documents"
                    colors={["#ef4444", "#fee2e2"]} // Red/Pink
                />
                <StatusWidget
                    title="Bank & Card Statements"
                    description="Bank & Card statements data in a structured format"
                    processedCount={stats.bankStatements.processing}
                    totalCount={stats.bankStatements.processing + stats.bankStatements.ready + 10} // Mock total
                    uploadCategory="STATEMENT"
                    viewLink="/documents?category=STATEMENT"
                    colors={["#f59e0b", "#fef3c7"]} // Amber/Yellow
                />
                <StatusWidget
                    title="Other Documents"
                    description="Important documents with intelligent tags"
                    processedCount={0}
                    totalCount={0}
                    uploadCategory="OTHER"
                    viewLink="/documents?category=OTHER"
                    colors={["#3b82f6", "#dbeafe"]} // Blue/LightBlue
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[500px]">
                <div className="lg:col-span-2 h-full">
                    <ExpenseChart data={stats.expenses} />
                </div>
                <div className="lg:col-span-1 h-full">
                    <BookkeepingInfo />
                </div>
            </div>
        </div>
    );
}
