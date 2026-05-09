import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-access";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const access = await getAdminSession();
  if (!access.isAllowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const payload = await request.json();

  try {
    const game = await prisma.game.create({
      data: {
        id: payload.id || undefined,
        name: payload.name,
        emoji: payload.emoji || "🎮",
        imageUrl: payload.imageUrl || null,
        active: true,
        isGlobal: true
      }
    });

    return NextResponse.json({ ok: true, game }, { status: 201 });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      fallback: true,
      message: "Jogo guardado apenas no estado local da UI. Configura DATABASE_URL para persistir.",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 202 });
  }
}
