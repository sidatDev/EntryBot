import { getUploadHistory } from "@/lib/actions";
import { UploadHistoryTable } from "@/components/history/UploadHistoryTable";

export default async function HistoryPage({
    searchParams,
}: {
    searchParams: { page?: string, search?: string };
}) {
    const page = Number(searchParams.page) || 1;
    const search = searchParams.search || "";
    const { documents, pagination } = await getUploadHistory(page, 25, search);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold text-slate-800">Upload History</h1>
                <p className="text-slate-500">View and manage the full log of document uploads and activities.</p>
            </div>

            <UploadHistoryTable documents={documents} pagination={pagination} />
        </div>
    );
}
