import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getCurrentUserServer() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const isAdmin = session?.user?.role === "ADMIN";

  if (!userId) {
    return { session, server: null, isAdmin };
  }

  const server = isAdmin
    ? await prisma.server.findFirst({ orderBy: { createdAt: "desc" } })
    : await prisma.server.findFirst({
        where: {
          accesses: {
            some: { userId }
          }
        },
        orderBy: { createdAt: "desc" }
      });

  return { session, server, isAdmin };
}

export async function canAccessServer(serverId: string) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) return false;
  if (session?.user?.role === "ADMIN") return true;

  const access = await prisma.serverAccess.findUnique({
    where: {
      userId_serverId: {
        userId,
        serverId
      }
    }
  });

  return Boolean(access);
}
