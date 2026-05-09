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
    const classRow = await prisma.class.create({
      data: {
        gameId: payload.gameId,
        name: payload.name,
        role: payload.role || "DPS",
        emoji: payload.emoji || "⚔️"
      }
    });

    return NextResponse.json({ ok: true, class: classRow }, { status: 201 });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      fallback: true,
      message: "Classe guardada apenas no estado local da UI. Configura DATABASE_URL para persistir.",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 202 });
  }
}
