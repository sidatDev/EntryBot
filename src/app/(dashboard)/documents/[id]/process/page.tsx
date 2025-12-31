import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getInvoicesByDocument } from "@/lib/actions";
import { ProcessPageClient } from "./client";

export default async function ProcessPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const document = await prisma.document.findUnique({
        where: { id },
        include: {
            identityCard: true
        }
    });

    if (!document) {
        notFound();
    }

    const invoices = await getInvoicesByDocument(id);

    return (
        <ProcessPageClient
            document={document}
            initialInvoices={invoices}
        />
    );
}
