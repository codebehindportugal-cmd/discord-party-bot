import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBotApiKey } from "@/lib/utils";

export async function GET(request: Request, { params }: { params: { serverId: string } }) {
  const authError = requireBotApiKey(request);
  if (authError) return authError;

  const players = await prisma.player.findMany({
    where: { serverId: params.serverId },
    include: { game: true, class: true },
    orderBy: { username: "asc" }
  });

  return NextResponse.json({
    serverId: params.serverId,
    players: players.map((player) => ({
      id: player.id,
      discordId: player.discordId,
      username: player.username,
      game: player.game.name,
      class: player.class?.name || null,
      role: player.class?.role || null,
      totalEarnings: player.totalEarnings,
      totalMinutes: player.totalMinutes,
      eventsCount: player.eventsCount
    }))
  });
}
