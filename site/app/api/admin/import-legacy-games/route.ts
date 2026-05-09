import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-access";
import { importLegacyGames } from "@/lib/legacy-game-import";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST() {
  const access = await getAdminSession();

  if (!access.isAllowed) {
    return NextResponse.json({ error: "Sem acesso." }, { status: 403 });
  }

  const result = await importLegacyGames();
  const games = await prisma.game.findMany({
    where: { isGlobal: true },
    include: { classes: true },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({
    ok: true,
    ...result,
    games: games.map((game) => ({
      id: game.id,
      name: game.name,
      emoji: game.emoji,
      active: game.active,
      classes: game.classes.map((classRow) => ({
        id: classRow.id,
        name: classRow.name,
        role: classRow.role,
        emoji: classRow.emoji
      }))
    }))
  });
}
