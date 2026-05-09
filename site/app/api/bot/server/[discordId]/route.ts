import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBotApiKey } from "@/lib/utils";

const limitsByPlan = {
  FREE: { maxPlayers: 5, maxEvents: 1, maxGames: 1 },
  PRO: { maxPlayers: 20, maxEvents: 999, maxGames: 2 },
  PREMIUM: { maxPlayers: 99999, maxEvents: 99999, maxGames: 99999 }
};

export async function GET(request: Request, { params }: { params: { discordId: string } }) {
  const authError = requireBotApiKey(request);
  if (authError) return authError;

  const dbServer = await prisma.server.findUnique({
    where: { discordId: params.discordId },
    include: { features: true }
  });

  if (!dbServer) {
    return NextResponse.json({ error: "Server not found" }, { status: 404 });
  }

  const plan = dbServer.plan;
  return NextResponse.json({
    id: dbServer.id,
    discordId: dbServer.discordId,
    plan,
    planExpiresAt: dbServer.planExpiresAt,
    config: {
      currency: dbServer.currency,
      currencySymbol: dbServer.currencySymbol,
      language: dbServer.language,
      limits: limitsByPlan[plan],
      features: Object.fromEntries(dbServer.features.map((feature) => [feature.key, {
        enabled: feature.enabled,
        config: feature.config
      }]))
    }
  });
}
