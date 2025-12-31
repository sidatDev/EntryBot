import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getInitialRedirectPath } from "@/lib/permissions-actions";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (session?.user?.id) {
    const path = await getInitialRedirectPath(session.user.id);
    redirect(path);
  } else {
    redirect("/login");
  }
}
