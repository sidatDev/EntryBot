import { prisma } from "@/lib/prisma";
import { DocumentViewer } from "@/components/document/DocumentViewer";
import { InvoiceForm } from "@/components/forms/InvoiceForm";
import { notFound } from "next/navigation";

export default async function ProcessPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const document = await prisma.document.findUnique({
        where: { id },
    });

    if (!document) {
        notFound();
    }

    return (
        <div className="fixed inset-0 top-0 left-64 z-0 flex h-screen bg-slate-50">
            <div className="w-1/2 h-full border-r border-slate-200 bg-white">
                <InvoiceForm documentId={document.id} />
            </div>
            <div className="w-1/2 h-full bg-slate-100">
                <DocumentViewer url={document.url} type={document.type} />
            </div>
        </div>
    );
}
