import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBotApiKey } from "@/lib/utils";

type EventSlotPayload = {
  party?: string;
  position?: number;
  label?: string;
  discordId?: string;
  username?: string;
};

export async function POST(request: Request) {
  const authError = requireBotApiKey(request);
  if (authError) return authError;

  const payload = await request.json();
  const serverDiscordId = String(payload.serverDiscordId || payload.guildId || "").trim();
  const gameId = String(payload.gameId || "").trim();

  if (!serverDiscordId || !gameId || !payload.name) {
    return NextResponse.json({ error: "serverDiscordId, gameId and name are required" }, { status: 400 });
  }

  const server = await prisma.server.findUnique({ where: { discordId: serverDiscordId } });
  const game = await prisma.game.findUnique({ where: { id: gameId } });

  if (!server) return NextResponse.json({ error: "Server not found" }, { status: 404 });
  if (!game) return NextResponse.json({ error: "Game not found" }, { status: 404 });

  const slots = Array.isArray(payload.slots) ? payload.slots as EventSlotPayload[] : [];
  const event = await prisma.event.create({
    data: {
      name: String(payload.name),
      description: payload.description ? String(payload.description) : null,
      lootType: payload.lootType || "TIME_BASED",
      status: payload.status || "OPEN",
      scheduledAt: payload.scheduledAt ? new Date(payload.scheduledAt) : new Date(),
      endedAt: payload.endedAt ? new Date(payload.endedAt) : null,
      maxSlots: Number(payload.maxSlots || slots.length || 50),
      voiceChannelId: payload.voiceChannelId ? String(payload.voiceChannelId) : null,
      announceMessageId: payload.announceMessageId ? String(payload.announceMessageId) : null,
      createdBy: String(payload.createdBy || "bot"),
      serverId: server.id,
      gameId: game.id
    }
  });

  for (const [index, slot] of slots.entries()) {
    await prisma.eventSlot.create({
      data: {
        eventId: event.id,
        party: slot.party || "Party 1",
        position: Number(slot.position || index + 1),
        label: slot.label || "Slot"
      }
    });
  }

  return NextResponse.json({ ok: true, event }, { status: 201 });
}
