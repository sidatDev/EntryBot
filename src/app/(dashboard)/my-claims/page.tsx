
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

    // Isolate to "Assigned to Me" and "Processing"
    // The user asked for "claimed files", which usually implies "Processing" status.
    // We can show all assigned to me.
    const myClaims = await getDocuments(undefined, "PROCESSING", user.id);

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">My Claimed Tasks</h1>
                    <p className="text-slate-500 mt-1">Documents you have claimed and are working on.</p>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <DocumentList documents={myClaims} currentUser={user} />
            </div>
        </div>
    );
}
