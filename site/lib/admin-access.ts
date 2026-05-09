import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function getAdminSession() {
  const session = await getServerSession(authOptions);
  const allowedEmails = (process.env.SUPER_ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  const isConfigured = allowedEmails.length > 0;
  const email = session?.user?.email?.toLowerCase();
  const isRoleAdmin = session?.user?.role === "ADMIN";
  const isAllowed = Boolean(email && allowedEmails.includes(email));

  return {
    session,
    isConfigured,
    isAllowed: isRoleAdmin || (isConfigured ? isAllowed : Boolean(session)),
    userId: session?.user?.id
  };
}
