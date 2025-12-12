import { getBankStatements } from "@/lib/actions";
import { BankStatementList } from "@/components/documents/BankStatementList";
import { StatusTabs } from "@/components/documents/StatusTabs";

export default async function BankStatementsPage({
    searchParams,
}: {
    searchParams: { status?: string };
}) {
    const status = searchParams.status || "ALL";
    const documents = await getBankStatements(status);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold text-slate-800">Bank and Card Statements</h1>
                <p className="text-slate-500">Manage and process your bank and credit card statements.</p>
            </div>

            <StatusTabs currentStatus={status} />
            <BankStatementList documents={documents} />
        </div>
    );
}
