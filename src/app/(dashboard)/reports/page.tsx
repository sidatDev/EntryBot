import { getExpenseReport } from "@/lib/actions";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { TrendingUp, TrendingDown, DollarSign, FileText, Calendar, Users } from "lucide-react";

export default async function ReportsPage({
    searchParams,
}: {
    searchParams: Promise<{ view?: string; year?: string; month?: string }>;
}) {
    const session = await getServerSession(authOptions);
    const user = session?.user;

    if (!user) redirect("/login");

    // Get user's organization
    const organizationId = user.organizationId;
    if (!organizationId) {
        return <div className="p-8">No organization found</div>;
    }

    const params = await searchParams;
    const viewType = (params.view as "monthly" | "annual") || "annual";
    const year = params.year ? parseInt(params.year) : new Date().getFullYear();
    const month = params.month ? parseInt(params.month) : new Date().getMonth() + 1;

    // Fetch expense report
    const report = await getExpenseReport(organizationId, viewType, year, month);

    // Calculate previous period for comparison
    const prevYear = viewType === "monthly" ? (month === 1 ? year - 1 : year) : year - 1;
    const prevMonth = viewType === "monthly" ? (month === 1 ? 12 : month - 1) : month;
    const prevReport = await getExpenseReport(organizationId, viewType, prevYear, prevMonth);

    const changePercent = prevReport.totalExpenses > 0
        ? ((report.totalExpenses - prevReport.totalExpenses) / prevReport.totalExpenses) * 100
        : 0;

    const buildUrl = (view: "monthly" | "annual", y?: number, m?: number) => {
        const params = new URLSearchParams();
        params.set("view", view);
        if (y) params.set("year", y.toString());
        if (m) params.set("month", m.toString());
        return `/reports?${params.toString()}`;
    };

    return (
        <div className="p-8 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-800">Expense Reports</h1>
                <p className="text-slate-500 mt-1">View and analyze your organization's expenses</p>
            </div>

            {/* View Toggle */}
            <div className="flex items-center justify-between">
                <div className="border-b border-slate-200">
                    <div className="flex gap-8">
                        <Link
                            href={buildUrl("annual", year)}
                            className={`pb-3 text-sm font-medium transition-colors ${viewType === "annual"
                                    ? "text-indigo-600 border-b-2 border-indigo-600"
                                    : "text-slate-500 hover:text-slate-700"
                                }`}
                        >
                            Annual View
                        </Link>
                        <Link
                            href={buildUrl("monthly", year, month)}
                            className={`pb-3 text-sm font-medium transition-colors ${viewType === "monthly"
                                    ? "text-indigo-600 border-b-2 border-indigo-600"
                                    : "text-slate-500 hover:text-slate-700"
                                }`}
                        >
                            Monthly View
                        </Link>
                    </div>
                </div>

                {/* Date Selector */}
                <div className="flex items-center gap-2">
                    {viewType === "monthly" && (
                        <select
                            value={month}
                            className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                            onChange={(e) => {
                                window.location.href = buildUrl("monthly", year, parseInt(e.target.value));
                            }}
                        >
                            {Array.from({ length: 12 }, (_, i) => (
                                <option key={i + 1} value={i + 1}>
                                    {new Date(2024, i, 1).toLocaleDateString("en-US", { month: "long" })}
                                </option>
                            ))}
                        </select>
                    )}
                    <select
                        value={year}
                        className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                        onChange={(e) => {
                            window.location.href = buildUrl(viewType, parseInt(e.target.value), month);
                        }}
                    >
                        {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                            <option key={y} value={y}>
                                {y}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg border border-slate-200 p-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-500">Total Expenses</span>
                        <DollarSign className="h-5 w-5 text-indigo-500" />
                    </div>
                    <div className="text-3xl font-bold text-slate-800">
                        £{report.totalExpenses.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="mt-2 flex items-center gap-1 text-sm">
                        {changePercent >= 0 ? (
                            <>
                                <TrendingUp className="h-4 w-4 text-red-500" />
                                <span className="text-red-600">+{changePercent.toFixed(1)}%</span>
                            </>
                        ) : (
                            <>
                                <TrendingDown className="h-4 w-4 text-green-500" />
                                <span className="text-green-600">{changePercent.toFixed(1)}%</span>
                            </>
                        )}
                        <span className="text-slate-500">vs previous {viewType === "monthly" ? "month" : "year"}</span>
                    </div>
                </div>

                <div className="bg-white rounded-lg border border-slate-200 p-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-500">Invoice Count</span>
                        <FileText className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="text-3xl font-bold text-slate-800">{report.invoiceCount}</div>
                    <div className="mt-2 text-sm text-slate-500">Processed invoices</div>
                </div>

                <div className="bg-white rounded-lg border border-slate-200 p-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-500">Average Invoice</span>
                        <DollarSign className="h-5 w-5 text-amber-500" />
                    </div>
                    <div className="text-3xl font-bold text-slate-800">
                        £{report.averageInvoice.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="mt-2 text-sm text-slate-500">Per invoice</div>
                </div>

                <div className="bg-white rounded-lg border border-slate-200 p-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-500">Top Suppliers</span>
                        <Users className="h-5 w-5 text-green-500" />
                    </div>
                    <div className="text-3xl font-bold text-slate-800">{report.topSuppliers.length}</div>
                    <div className="mt-2 text-sm text-slate-500">Active vendors</div>
                </div>
            </div>

            {/* Monthly Breakdown Chart */}
            {viewType === "annual" && (
                <div className="bg-white rounded-lg border border-slate-200 p-6">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Monthly Breakdown</h2>
                    <div className="space-y-3">
                        {report.monthlyBreakdown.map((item) => {
                            const monthName = new Date(item.month + "-01").toLocaleDateString("en-US", {
                                month: "short",
                                year: "numeric",
                            });
                            const maxTotal = Math.max(...report.monthlyBreakdown.map((m) => m.total));
                            const barWidth = maxTotal > 0 ? (item.total / maxTotal) * 100 : 0;

                            return (
                                <div key={item.month}>
                                    <div className="flex items-center justify-between text-sm mb-1">
                                        <span className="text-slate-600 font-medium w-24">{monthName}</span>
                                        <span className="text-slate-800 font-semibold">
                                            £{item.total.toLocaleString("en-GB", {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            })}
                                        </span>
                                        <span className="text-slate-500 text-xs w-20 text-right">
                                            {item.count} invoice{item.count !== 1 ? "s" : ""}
                                        </span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2">
                                        <div
                                            className="bg-indigo-500 h-2 rounded-full transition-all"
                                            style={{ width: `${barWidth}%` }}
                                        ></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Top Suppliers */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">Top Suppliers</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-700 font-semibold border-b">
                            <tr>
                                <th className="p-4">Supplier Name</th>
                                <th className="p-4 text-right">Total Spent</th>
                                <th className="p-4 text-right">Invoice Count</th>
                                <th className="p-4 text-right">Avg Invoice</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {report.topSuppliers.map((supplier, idx) => (
                                <tr key={idx} className="hover:bg-slate-50">
                                    <td className="p-4 font-medium text-slate-800">{supplier.name}</td>
                                    <td className="p-4 text-right text-slate-800">
                                        £{supplier.total.toLocaleString("en-GB", {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })}
                                    </td>
                                    <td className="p-4 text-right text-slate-600">{supplier.count}</td>
                                    <td className="p-4 text-right text-slate-600">
                                        £{(supplier.total / supplier.count).toLocaleString("en-GB", {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })}
                                    </td>
                                </tr>
                            ))}
                            {report.topSuppliers.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-slate-400">
                                        No supplier data available for this period
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
