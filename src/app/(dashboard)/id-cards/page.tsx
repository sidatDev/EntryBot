import { getIdentityCards } from "@/lib/actions/identity-cards";
import { DocumentList } from "@/components/documents/DocumentList";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Identity Cards | EntryBot",
    description: "Manage and process identity cards (CNIC/NIC)",
};

export default async function IdentityCardsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
    const params = await searchParams; // Await searchParams in Next.js 15
    const status = params.status || "ALL";
    const documents = await getIdentityCards(status);

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center justify-between px-8 py-6 bg-white border-b border-slate-200">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Identity Cards</h1>
                    <p className="text-slate-500 mt-1">Process and manage CNIC/NIC records</p>
                </div>
            </div>

            <div className="flex-1 p-8 overflow-hidden">
                <DocumentList documents={documents || []} category="IDENTITY_CARD" />
            </div>
        </div>
    );
}
