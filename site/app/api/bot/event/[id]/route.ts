import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBotApiKey } from "@/lib/utils";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const authError = requireBotApiKey(request);
  if (authError) return authError;

  const event = await prisma.event.findUnique({
    where: { id: params.id },
    include: {
      server: true,
      game: true,
      slots: { include: { player: true }, orderBy: [{ party: "asc" }, { position: "asc" }] },
      participants: { include: { player: true } },
      lootEntries: true,
      lootSplits: { include: { player: true } },
      voiceSessions: { include: { player: true } }
    }
  });

  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
  return NextResponse.json({ event });
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const authError = requireBotApiKey(request);
  if (authError) return authError;

  const payload = await request.json();
  const event = await prisma.event.update({
    where: { id: params.id },
    data: {
      name: payload.name === undefined ? undefined : String(payload.name),
      description: payload.description === undefined ? undefined : payload.description ? String(payload.description) : null,
      status: payload.status,
      scheduledAt: payload.scheduledAt === undefined ? undefined : new Date(payload.scheduledAt),
      startedAt: payload.startedAt === undefined ? undefined : payload.startedAt ? new Date(payload.startedAt) : null,
      endedAt: payload.endedAt === undefined ? undefined : payload.endedAt ? new Date(payload.endedAt) : null,
      maxSlots: payload.maxSlots === undefined ? undefined : Number(payload.maxSlots),
      voiceChannelId: payload.voiceChannelId === undefined ? undefined : payload.voiceChannelId ? String(payload.voiceChannelId) : null,
      announceMessageId: payload.announceMessageId === undefined ? undefined : payload.announceMessageId ? String(payload.announceMessageId) : null
    }
  });

  return NextResponse.json({ ok: true, event });
}
