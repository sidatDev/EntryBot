
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUsersByRole } from "@/lib/actions";
import { ManagerView } from "@/components/dashboard/ManagerView";
import { redirect } from "next/navigation";

export default async function TeamPage() {
    const session = await getServerSession(authOptions);
    const user = session?.user;

    if (!user || user.role !== "MANAGER") {
        redirect("/dashboard"); // Or 403
    }

    const teamMembers = await getUsersByRole("ENTRY_OPERATOR");

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Team Oversight</h1>
                    <p className="text-slate-500 mt-1">Manage Entry Operators and monitor active tasks.</p>
                </div>
                <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold uppercase">Manager Mode</span>
            </div>

            <div className="mt-8">
                <ManagerView teamMembers={teamMembers} />
            </div>
        </div>
    );
}
