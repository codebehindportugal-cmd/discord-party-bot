import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { AdminConsole } from "@/components/admin-console";
import { getAdminSession } from "@/lib/admin-access";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const access = await getAdminSession();

  if (!access.isAllowed) {
    return (
      <DashboardShell>
        <section className="rounded-lg border border-danger/30 bg-danger/10 p-8">
          <h1 className="text-2xl font-semibold text-white">Sem acesso ao super-admin</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
            O teu email não está em `SUPER_ADMIN_EMAILS`. Adiciona o email da tua conta ao `site/.env` para gerir planos, jogos globais e classes.
          </p>
          <Link href="/dashboard" className="mt-6 inline-flex min-h-10 items-center rounded-md bg-discord px-4 text-sm font-semibold text-white">
            Voltar ao dashboard
          </Link>
        </section>
      </DashboardShell>
    );
  }

  const servers = await prisma.server.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      features: true,
      _count: {
        select: { events: true }
      }
    }
  });
  const games = await prisma.game.findMany({
    where: { isGlobal: true },
    include: { classes: true },
    orderBy: { createdAt: "desc" }
  });

  return (
    <DashboardShell>
      <AdminConsole
        showDevAccessWarning={!access.isConfigured}
        initialGames={games.map((game) => ({
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
        }))}
        initialServers={servers.map((server) => ({
          id: server.id,
          discordId: server.discordId,
          name: server.name,
          plan: server.plan,
          status: server.planExpiresAt && server.planExpiresAt < new Date() && server.plan !== "FREE" ? "expired" : "active",
          events: server._count.events,
          expiresAt: server.planExpiresAt ? server.planExpiresAt.toISOString().slice(0, 10) : null,
          features: Object.fromEntries(server.features.map((feature) => [feature.key, feature.enabled]))
        }))}
      />
    </DashboardShell>
  );
}
