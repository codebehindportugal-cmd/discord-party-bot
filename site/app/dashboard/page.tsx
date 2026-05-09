import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { EarningsChart, PlayerActivityChart } from "@/components/charts";
import { Badge, StatCard } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { formatGold } from "@/lib/utils";

export const dynamic = "force-dynamic";

function weekLabel(date: Date) {
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  return `${day}/${month}`;
}

export default async function DashboardPage() {
  const selectedServer = await prisma.server.findFirst({ orderBy: { createdAt: "desc" } });

  if (!selectedServer) {
    return (
      <DashboardShell>
        <h1 className="text-3xl font-semibold text-white">Dashboard</h1>
        <div className="mt-8 rounded-lg border border-warning/30 bg-warning/10 p-6 text-warning">
          Ainda não há servidores registados. Liga o bot a um servidor ou corre `npm run sync-guilds`.
        </div>
      </DashboardShell>
    );
  }

  const [eventsCount, activeEvents, pendingEvents, playerCount, totalGold, recentEvents, topPlayers, splits] = await Promise.all([
    prisma.event.count({ where: { serverId: selectedServer.id } }),
    prisma.event.count({ where: { serverId: selectedServer.id, status: "IN_PROGRESS" } }),
    prisma.event.count({ where: { serverId: selectedServer.id, status: "OPEN" } }),
    prisma.player.count({ where: { serverId: selectedServer.id } }),
    prisma.lootSplit.aggregate({ where: { confirmed: true, event: { serverId: selectedServer.id } }, _sum: { amount: true } }),
    prisma.event.findMany({
      where: { serverId: selectedServer.id },
      include: { game: true, _count: { select: { participants: true } } },
      orderBy: { scheduledAt: "desc" },
      take: 6
    }),
    prisma.player.findMany({
      where: { serverId: selectedServer.id },
      orderBy: { totalMinutes: "desc" },
      take: 8
    }),
    prisma.lootSplit.findMany({
      where: { confirmed: true, event: { serverId: selectedServer.id } },
      include: { event: true },
      orderBy: { createdAt: "asc" }
    })
  ]);

  const earningsByWeek = new Map<string, number>();
  for (const split of splits) {
    const label = weekLabel(split.createdAt);
    earningsByWeek.set(label, (earningsByWeek.get(label) || 0) + split.amount);
  }
  const earningsData = [...earningsByWeek.entries()].map(([week, gold]) => ({ week, gold }));
  const playerActivity = topPlayers.map((player) => ({ name: player.username, minutes: player.totalMinutes }));

  return (
    <DashboardShell serverName={selectedServer.name} plan={selectedServer.plan}>
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-discord">Dashboard</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Visão geral do servidor</h1>
        </div>
        <Badge tone="success">Dados reais</Badge>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-4">
        <StatCard label="Eventos totais" value={String(eventsCount)} helper={`${activeEvents} em progresso`} />
        <StatCard label="Gold distribuído" value={formatGold(totalGold._sum.amount || 0)} />
        <StatCard label="Jogadores registados" value={String(playerCount)} />
        <StatCard label="Eventos abertos" value={String(pendingEvents)} />
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-border bg-panel p-5">
          <h2 className="font-semibold text-white">Ganhos confirmados</h2>
          <div className="mt-5">
            {earningsData.length ? <EarningsChart data={earningsData} /> : <p className="text-sm text-muted">Sem splits confirmados ainda.</p>}
          </div>
        </section>
        <section className="rounded-lg border border-border bg-panel p-5">
          <h2 className="font-semibold text-white">Jogadores mais ativos</h2>
          <div className="mt-5">
            {playerActivity.length ? <PlayerActivityChart data={playerActivity} /> : <p className="text-sm text-muted">Sem jogadores registados ainda.</p>}
          </div>
        </section>
      </div>

      <section className="mt-8 rounded-lg border border-border bg-panel">
        <div className="flex items-center justify-between border-b border-border p-5">
          <h2 className="font-semibold text-white">Eventos recentes</h2>
          <Link href="/dashboard/events" className="text-sm text-discord hover:text-indigo-300">Ver todos</Link>
        </div>
        <div className="divide-y divide-border">
          {recentEvents.length ? recentEvents.map((event) => (
            <Link key={event.id} href={`/dashboard/events/${event.id}`} className="grid gap-3 p-5 hover:bg-panelSoft md:grid-cols-[1fr_auto_auto]">
              <div>
                <p className="font-medium text-white">{event.name}</p>
                <p className="text-sm text-muted">{event.game.name} - {event.scheduledAt.toLocaleString("pt-PT")}</p>
              </div>
              <Badge tone={event.status === "COMPLETED" ? "success" : event.status === "OPEN" ? "warning" : "discord"}>{event.status}</Badge>
              <p className="text-sm text-slate-300">{event._count.participants} jogadores</p>
            </Link>
          )) : <p className="p-5 text-sm text-muted">Sem eventos criados ainda.</p>}
        </div>
      </section>
    </DashboardShell>
  );
}
