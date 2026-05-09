import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { formatGold } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const selectedServer = await prisma.server.findFirst({ orderBy: { createdAt: "desc" } });
  const events = selectedServer
    ? await prisma.event.findMany({
        where: { serverId: selectedServer.id },
        include: {
          game: true,
          lootEntries: true,
          _count: { select: { participants: true } }
        },
        orderBy: { scheduledAt: "desc" }
      })
    : [];

  return (
    <DashboardShell serverName={selectedServer?.name} plan={selectedServer?.plan}>
      <h1 className="text-3xl font-semibold text-white">Eventos</h1>
      <div className="mt-6 overflow-hidden rounded-lg border border-border">
        <table className="w-full border-collapse bg-panel text-left text-sm">
          <thead className="bg-panelSoft text-slate-300">
            <tr>
              <th className="p-4">Evento</th>
              <th className="p-4">Jogo</th>
              <th className="p-4">Estado</th>
              <th className="p-4">Loot</th>
              <th className="p-4">Participantes</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => {
              const loot = event.lootEntries.reduce((total, entry) => total + entry.value, 0);
              return (
                <tr key={event.id} className="border-t border-border">
                  <td className="p-4"><Link href={`/dashboard/events/${event.id}`} className="font-medium text-white hover:text-discord">{event.name}</Link></td>
                  <td className="p-4 text-slate-300">{event.game.name}</td>
                  <td className="p-4"><Badge tone={event.status === "COMPLETED" ? "success" : event.status === "OPEN" ? "warning" : "discord"}>{event.status}</Badge></td>
                  <td className="p-4 text-slate-300">{formatGold(loot)}</td>
                  <td className="p-4 text-slate-300">{event._count.participants}</td>
                </tr>
              );
            })}
            {!events.length ? (
              <tr><td className="p-4 text-muted" colSpan={5}>Sem eventos criados ainda.</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </DashboardShell>
  );
}
