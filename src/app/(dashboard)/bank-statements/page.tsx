import { getBankStatements } from "@/lib/actions";
import { BankStatementList } from "@/components/documents/BankStatementList";
import { StatusTabs } from "@/components/documents/StatusTabs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function BankStatementsPage({
    searchParams,
}: {
    searchParams: Promise<{ status?: string; orgId?: string }>;
}) {
    const { status = "ALL", orgId } = await searchParams;
    const documents = await getBankStatements(status, orgId);
    const session = await getServerSession(authOptions);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold text-slate-800">Bank and Card Statements</h1>
                <p className="text-slate-500">Manage and process your bank and credit card statements.</p>
            </div>

            <StatusTabs />
            <BankStatementList documents={documents} currentUser={session?.user} />
        </div>
    );
}
