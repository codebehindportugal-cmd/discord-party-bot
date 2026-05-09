import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-access";
import { prisma } from "@/lib/prisma";
import { getServerEnv } from "@/lib/server-env";

export const dynamic = "force-dynamic";

function formatServer(server: {
  id: string;
  discordId: string;
  name: string;
  plan: string;
  planExpiresAt: Date | null;
  features: Array<{ key: string; enabled: boolean }>;
  _count: { events: number };
}) {
  return {
    id: server.id,
    discordId: server.discordId,
    name: server.name,
    plan: server.plan,
    status: server.planExpiresAt && server.planExpiresAt < new Date() && server.plan !== "FREE" ? "expired" : "active",
    events: server._count.events,
    expiresAt: server.planExpiresAt ? server.planExpiresAt.toISOString().slice(0, 10) : null,
    features: Object.fromEntries(server.features.map((feature) => [feature.key, feature.enabled]))
  };
}

export async function POST() {
  const access = await getAdminSession();

  if (!access.isAllowed) {
    return NextResponse.json({ error: "Sem acesso." }, { status: 403 });
  }

  const token = getServerEnv("DISCORD_TOKEN");

  if (!token) {
    return NextResponse.json({
      error: "DISCORD_TOKEN em falta no ambiente do site."
    }, { status: 400 });
  }

  const { Client, GatewayIntentBits } = eval("require")("discord.js");
  const client = new Client({ intents: [GatewayIntentBits.Guilds] });

  try {
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Timeout ao ligar ao Discord.")), 15000);

      client.once("ready", () => {
        clearTimeout(timeout);
        resolve();
      });

      client.login(token).catch((error: unknown) => {
        clearTimeout(timeout);
        reject(error);
      });
    });

    const guilds = [...client.guilds.cache.values()] as Array<{ id: string; name: string }>;

    for (const guild of guilds) {
      await prisma.server.upsert({
        where: { discordId: guild.id },
        update: { name: guild.name },
        create: {
          discordId: guild.id,
          name: guild.name,
          plan: "FREE",
          language: (getServerEnv("DEFAULT_LANGUAGE") || "pt").toUpperCase()
        }
      });
    }

    const servers = await prisma.server.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        features: true,
        _count: {
          select: { events: true }
        }
      }
    });

    return NextResponse.json({
      ok: true,
      synced: guilds.length,
      servers: servers.map(formatServer)
    });
  } catch (error) {
    return NextResponse.json({
      error: "Nao foi possivel sincronizar servidores.",
      detail: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  } finally {
    client.destroy();
  }
}
