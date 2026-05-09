import { DashboardShell } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { formatGold, formatMinutes } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PlayersPage() {
  const selectedServer = await prisma.server.findFirst({ orderBy: { createdAt: "desc" } });
  const players = selectedServer
    ? await prisma.player.findMany({
        where: { serverId: selectedServer.id },
        include: { class: true, game: true },
        orderBy: { totalMinutes: "desc" }
      })
    : [];

  return (
    <DashboardShell serverName={selectedServer?.name} plan={selectedServer?.plan}>
      <h1 className="text-3xl font-semibold text-white">Jogadores</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {players.map((player) => (
          <article key={player.id} className="rounded-lg border border-border bg-panel p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold text-white">{player.username}</h2>
                <p className="mt-1 text-sm text-muted">{player.game.name} · {player.class?.name || "Sem classe"}</p>
              </div>
              <Badge tone={player.class?.role === "DPS" ? "warning" : "discord"}>{player.class?.role || "-"}</Badge>
            </div>
            <dl className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between gap-3"><dt className="text-muted">Tempo total</dt><dd className="text-white">{formatMinutes(player.totalMinutes)}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted">Ganhos</dt><dd className="text-gold">{formatGold(player.totalEarnings)}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted">Eventos</dt><dd className="text-white">{player.eventsCount}</dd></div>
            </dl>
          </article>
        ))}
      </div>
      {!players.length ? <p className="mt-6 text-sm text-muted">Sem jogadores registados ainda.</p> : null}
    </DashboardShell>
  );
}
