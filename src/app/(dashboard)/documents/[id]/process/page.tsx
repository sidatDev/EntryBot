import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getInvoicesByDocument } from "@/lib/actions";
import { ProcessPageClient } from "./client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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

    const session = await getServerSession(authOptions);
    const isReadOnly = session?.user?.email ? (session.user as any).role === "CLIENT" : false;

    return (
        <ProcessPageClient
            document={document}
            initialInvoices={invoices}
            isReadOnly={isReadOnly}
        />
    );
}
