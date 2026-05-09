import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Sessao invalida." }, { status: 401 });
  }

  const payload = await request.json();
  const discordId = String(payload.discordId || "").trim();

  if (!discordId) {
    return NextResponse.json({ error: "Indica o Discord Server ID." }, { status: 400 });
  }

  const server = await prisma.server.findUnique({
    where: { discordId },
    include: { accesses: true }
  });

  if (!server) {
    return NextResponse.json({
      error: "Servidor nao encontrado. Instala o bot nesse servidor e pede ao super-admin para sincronizar servidores."
    }, { status: 404 });
  }

  const alreadyClaimedByOtherUser = server.accesses.some((access) => access.userId !== userId);

  if (alreadyClaimedByOtherUser && session.user.role !== "ADMIN") {
    return NextResponse.json({
      error: "Este servidor ja esta associado a outra conta. Contacta o super-admin."
    }, { status: 409 });
  }

  await prisma.serverAccess.upsert({
    where: {
      userId_serverId: {
        userId,
        serverId: server.id
      }
    },
    update: {},
    create: {
      userId,
      serverId: server.id,
      role: "OWNER"
    }
  });

  return NextResponse.json({ ok: true, serverId: server.id });
}
