import { getDocuments } from "@/lib/actions";
import { DocumentList } from "@/components/documents/DocumentList";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";

export default async function DocumentsPage({
    searchParams,
}: {
    searchParams: Promise<{ category?: string; assignedTo?: string; tab?: string; orgId?: string }>;
}) {
    const { category, assignedTo, tab = "all", orgId } = await searchParams;

    const session = await getServerSession(authOptions);

    // OPERATOR GUARD: Operators must use the Organization List (/dashboard)
    if (session?.user?.role === "ENTRY_OPERATOR") {
        const { redirect } = await import("next/navigation");
        redirect("/dashboard");
    }

    // CLIENT AUTO-FILTER: If no orgId param, redirect with first organization's ID
    if (!orgId) {
        const { getMyOrganizations } = await import("@/lib/actions/organization");
        const organizations = await getMyOrganizations();

        // If user has organizations, redirect with the first one's ID
        if (organizations && organizations.length > 0) {
            const { redirect } = await import("next/navigation");
            const params = new URLSearchParams();

            // Preserve existing query parameters
            if (category) params.set("category", category);
            if (assignedTo) params.set("assignedTo", assignedTo);
            if (tab) params.set("tab", tab);

            // Add first org's ID as the default
            params.set("orgId", organizations[0].id);

            redirect(`/documents?${params.toString()}`);
        }
    }

    // Determine status filter based on tab
    let statusFilter: string | undefined;
    if (tab === "new") statusFilter = "UPLOADED";
    else if (tab === "processed") statusFilter = "PROCESSING";
    else if (tab === "reports") statusFilter = "COMPLETED";

    // Fetch documents based on category and status, AND orgId
    const rawDocuments = await getDocuments(category, statusFilter, assignedTo, undefined, orgId);

    // Filter out Bank Statements as they have their own page
    const allDocuments = rawDocuments.filter((doc: any) =>
        !["STATEMENT", "BANK_STATEMENT", "CARD_STATEMENT"].includes(doc.category)
    );

    // Further filter for "approved" tab (based on approvalStatus, not status)
    const documents = tab === "approved"
        ? allDocuments.filter((doc: any) => doc.approvalStatus === "APPROVED")
        : allDocuments;

    // Determine page title based on category
    const pageTitle = category === "SALES_INVOICE"
        ? "Sales Invoices & Receipts"
        : category === "PURCHASE_INVOICE"
            ? "Purchase Invoices & Receipts"
            : "All Invoices & Receipts";

    const pageDescription = category === "SALES_INVOICE"
        ? "Manage your sales invoices and receipts"
        : category === "PURCHASE_INVOICE"
            ? "Manage your purchase invoices and receipts"
            : "Manage all your invoices and receipts";

    // Build query params for tab links
    const buildTabUrl = (tabName: string) => {
        const params = new URLSearchParams();
        if (category) params.set("category", category);
        if (assignedTo) params.set("assignedTo", assignedTo);
        if (orgId) params.set("orgId", orgId);
        params.set("tab", tabName);
        return `/documents?${params.toString()}`;
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold text-slate-800">{pageTitle}</h1>
                <p className="text-slate-500">{pageDescription}</p>
            </div>

            {/* Status Filter Tabs */}
            <div className="border-b border-slate-200">
                <div className="flex gap-8">
                    <Link
                        href={buildTabUrl("all")}
                        className={`pb-3 text-sm font-medium transition-colors relative ${tab === "all"
                            ? "text-indigo-600 border-b-2 border-indigo-600"
                            : "text-slate-500 hover:text-slate-700 hover:border-b-2 hover:border-slate-300"
                            }`}
                    >
                        All
                    </Link>
                    <Link
                        href={buildTabUrl("new")}
                        className={`pb-3 text-sm font-medium transition-colors relative ${tab === "new"
                            ? "text-indigo-600 border-b-2 border-indigo-600"
                            : "text-slate-500 hover:text-slate-700 hover:border-b-2 hover:border-slate-300"
                            }`}
                    >
                        New
                    </Link>
                    <Link
                        href={buildTabUrl("processed")}
                        className={`pb-3 text-sm font-medium transition-colors relative ${tab === "processed"
                            ? "text-indigo-600 border-b-2 border-indigo-600"
                            : "text-slate-500 hover:text-slate-700 hover:border-b-2 hover:border-slate-300"
                            }`}
                    >
                        Processed
                    </Link>
                    <Link
                        href={buildTabUrl("approved")}
                        className={`pb-3 text-sm font-medium transition-colors relative ${tab === "approved"
                            ? "text-indigo-600 border-b-2 border-indigo-600"
                            : "text-slate-500 hover:text-slate-700 hover:border-b-2 hover:border-slate-300"
                            }`}
                    >
                        Approved
                    </Link>
                    <Link
                        href={buildTabUrl("reports")}
                        className={`pb-3 text-sm font-medium transition-colors relative ${tab === "reports"
                            ? "text-indigo-600 border-b-2 border-indigo-600"
                            : "text-slate-500 hover:text-slate-700 hover:border-b-2 hover:border-slate-300"
                            }`}
                    >
                        Reports
                    </Link>
                </div>
            </div>

            <DocumentList
                documents={documents}
                category={category}
                currentUser={session?.user}
            />
        </div>
    );
}
