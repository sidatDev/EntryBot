import { getDashboardStats } from "@/lib/actions";
import { StatusWidget } from "@/components/dashboard/StatusWidget";
import { ExpenseChart } from "@/components/dashboard/ExpenseChart";
import { BookkeepingInfo } from "@/components/dashboard/BookkeepingInfo";

export default async function DashboardPage() {
    const stats = await getDashboardStats();

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
