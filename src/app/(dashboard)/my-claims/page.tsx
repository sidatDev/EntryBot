
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDocuments } from "@/lib/actions";
import { DocumentList } from "@/components/documents/DocumentList";
import { redirect } from "next/navigation";

export default async function MyClaimsPage() {
    const session = await getServerSession(authOptions);
    const user = session?.user;

    if (!user) {
        redirect("/auth/login");
    }

    // Show Processed/Completed files instead of just active claims
    // The user requested "files which have been process by the data entry operator"
    const myClaims = await getDocuments(undefined, "COMPLETED", user.id);

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Processed Tasks</h1>
                    <p className="text-slate-500 mt-1">History of documents you have processed.</p>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <DocumentList documents={myClaims} currentUser={user} />
            </div>
        </div>
    );
}
