
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDocuments } from "@/lib/actions";
import { prisma } from "@/lib/prisma"; // Direct access for user details
import { DocumentList } from "@/components/documents/DocumentList";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface PageProps {
    params: Promise<{
        operatorId: string;
    }>;
}

export default async function OperatorDetailPage({ params }: PageProps) {
    const session = await getServerSession(authOptions);
    const currentUser = session?.user;

    if (!currentUser || (currentUser.role !== "MANAGER" && currentUser.role !== "ADMIN")) {
        redirect("/dashboard");
    }

    const { operatorId } = await params;

    // Fetch Operator Details
    const operator = await prisma.user.findUnique({
        where: { id: operatorId },
        select: { id: true, name: true, email: true, status: true }
    });

    if (!operator) {
        return <div>Operator not found</div>;
    }

    // Fetch Documents assigned to this operator
    // reusing getDocuments(category, status, assignedToId)
    // We want ALL assigned documents (Processing, Completed?) 
    // Usually "Processing" is the active queue. Let's show Processing by default, maybe others.
    // For now, let's fetch 'PROCESSING' as the main queue.
    const assignedDocs = await getDocuments(undefined, "PROCESSING", operatorId);

    return (
        <div className="p-8">
            <div className="mb-6">
                <Link href="/team" className="text-sm text-slate-500 hover:text-indigo-600 flex items-center gap-1 mb-4">
                    <ArrowLeft className="h-4 w-4" /> Back to Team
                </Link>
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{operator.name}</h1>
                        <p className="text-slate-500">{operator.email}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${operator.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                        {operator.status}
                    </span>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h2 className="text-lg font-bold text-slate-800 mb-4">Active Queue</h2>
                <DocumentList documents={assignedDocs} currentUser={currentUser} readOnly={true} />
            </div>
        </div>
    );
}
