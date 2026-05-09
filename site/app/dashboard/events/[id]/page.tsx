import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { SplitPieChart } from "@/components/charts";
import { Badge, StatCard } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { canAccessServer } from "@/lib/user-server-access";
import { formatGold, formatMinutes } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function EventDetailPage({ params }: { params: { id: string } }) {
  const event = await prisma.event.findUnique({
    where: { id: params.id },
    include: {
      server: true,
      game: true,
      slots: {
        include: { player: { include: { class: true } } },
        orderBy: [{ party: "asc" }, { position: "asc" }]
      },
      participants: {
        include: { player: { include: { class: true } } },
        orderBy: { joinedAt: "asc" }
      },
      lootEntries: true,
      lootSplits: { include: { player: true } },
      voiceSessions: { include: { player: { include: { class: true } } }, orderBy: { joinedAt: "asc" } },
      _count: { select: { participants: true } }
    }
  });

  if (!event) notFound();
  if (!(await canAccessServer(event.serverId))) notFound();

  const lootTotal = event.lootEntries.reduce((total, entry) => total + entry.value, 0);
  const duration = event.startedAt && event.endedAt ? Math.max(0, (event.endedAt.getTime() - event.startedAt.getTime()) / 60000) : 0;
  const splitRows = event.lootSplits.map((split) => ({
    player: split.player.username,
    percentage: split.percentage
  }));
  const slotsByParty = event.slots.reduce<Record<string, typeof event.slots>>((groups, slot) => {
    const party = slot.party || "Party";
    groups[party] = groups[party] || [];
    groups[party].push(slot);
    return groups;
  }, {});

  return (
    <DashboardShell serverName={event.server.name} plan={event.server.plan}>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-discord">Detalhe de evento</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">{event.game.emoji} {event.name}</h1>
        </div>
        <Badge tone={event.status === "COMPLETED" ? "success" : event.status === "OPEN" ? "warning" : "discord"}>{event.status}</Badge>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <StatCard label="Loot total" value={formatGold(lootTotal)} />
        <StatCard label="Duracao" value={duration ? formatMinutes(duration) : "Ainda sem fim"} />
        <StatCard label="Participantes" value={String(event._count.participants)} />
      </div>

      <section className="mt-8 rounded-lg border border-border bg-panel p-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="font-semibold text-white">Mapa do evento</h2>
            <p className="mt-1 text-sm text-muted">Mesmas parties e slots publicados no Discord.</p>
          </div>
          <p className="text-sm text-slate-300">
            {event.voiceChannelId ? `Canal de voz: ${event.voiceChannelId}` : "Sem canal de voz"}
          </p>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-3">
          {Object.entries(slotsByParty).map(([party, slots]) => (
            <div key={party} className="rounded-md border border-white/10 bg-black/25 p-4">
              <h3 className="text-sm font-semibold text-white">{party}</h3>
              <div className="mt-3 space-y-2">
                {slots.map((slot) => (
                  <div key={slot.id} className="grid grid-cols-[2.5rem_1fr_auto] items-center gap-2 rounded border border-white/10 bg-white/[0.03] px-3 py-2 text-sm">
                    <span className="rounded bg-white/10 px-2 py-1 text-center text-xs text-slate-300">{slot.position}</span>
                    <span className="text-slate-200">{slot.label}</span>
                    {slot.player ? (
                      <span className="text-right text-rose-200">{slot.player.username}</span>
                    ) : (
                      <span className="text-right text-emerald-300">Livre</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
          {!event.slots.length ? <p className="text-sm text-muted">Sem slots configurados para este evento.</p> : null}
        </div>
      </section>

      <div className="mt-8 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-lg border border-border bg-panel p-5">
          <h2 className="font-semibold text-white">Sessoes de voice</h2>
          <div className="mt-6 space-y-4">
            {event.voiceSessions.map((session) => (
              <div key={session.id} className="rounded-md border border-border bg-panelSoft p-4">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-white">{session.player.username} <span className="text-muted">({session.player.class?.role || "-"})</span></span>
                  <span className="text-slate-300">{formatMinutes(session.durationMinutes)}</span>
                </div>
                <p className="mt-2 text-xs text-muted">
                  {session.joinedAt.toLocaleString("pt-PT")} - {session.leftAt ? session.leftAt.toLocaleString("pt-PT") : "em voz"}
                </p>
              </div>
            ))}
            {!event.voiceSessions.length ? <p className="text-sm text-muted">Sem sessoes de voice registadas.</p> : null}
          </div>
        </section>

        <section className="rounded-lg border border-border bg-panel p-5">
          <h2 className="font-semibold text-white">Divisao percentual</h2>
          <div className="mt-5">
            {splitRows.length ? <SplitPieChart data={splitRows} /> : <p className="text-sm text-muted">Sem split calculado ainda.</p>}
          </div>
        </section>
      </div>

      <section className="mt-8 overflow-hidden rounded-lg border border-border">
        <table className="w-full border-collapse bg-panel text-left text-sm">
          <thead className="bg-panelSoft text-slate-300">
            <tr>
              <th className="p-4">Jogador</th>
              <th className="p-4">Tempo total</th>
              <th className="p-4">% participacao</th>
              <th className="p-4">Valor recebido</th>
            </tr>
          </thead>
          <tbody>
            {event.lootSplits.map((split) => (
              <tr key={split.id} className="border-t border-border">
                <td className="p-4 font-medium text-white">{split.player.username}</td>
                <td className="p-4 text-slate-300">{formatMinutes(split.minutes)}</td>
                <td className="p-4 text-slate-300">{split.percentage.toFixed(1)}%</td>
                <td className="p-4 text-gold">{formatGold(split.amount)}</td>
              </tr>
            ))}
            {!event.lootSplits.length ? (
              <tr><td className="p-4 text-muted" colSpan={4}>Sem split calculado ainda.</td></tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </DashboardShell>
  );
}
