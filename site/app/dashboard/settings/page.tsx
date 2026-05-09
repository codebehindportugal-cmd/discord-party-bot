import { DashboardShell } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function channelValue(id?: string | null) {
  return id ? `<#${id}>` : "Não configurado";
}

export default async function SettingsPage() {
  const server = await prisma.server.findFirst({ orderBy: { createdAt: "desc" } });

  return (
    <DashboardShell serverName={server?.name} plan={server?.plan}>
      <h1 className="text-3xl font-semibold text-white">Configurações</h1>
      {!server ? (
        <p className="mt-6 text-sm text-muted">Sem servidor registado ainda.</p>
      ) : (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <section className="rounded-lg border border-border bg-panel p-5">
            <h2 className="font-semibold text-white">Canais Discord</h2>
            <div className="mt-5 space-y-4 text-sm">
              <p className="flex justify-between gap-4"><span className="text-muted">Anúncios</span><span className="text-white">{channelValue(server.announceChanId)}</span></p>
              <p className="flex justify-between gap-4"><span className="text-muted">Eventos</span><span className="text-white">{channelValue(server.eventsChanId)}</span></p>
              <p className="flex justify-between gap-4"><span className="text-muted">Logs</span><span className="text-white">{channelValue(server.logsChanId)}</span></p>
              <p className="flex justify-between gap-4"><span className="text-muted">Categoria voz</span><span className="text-white">{channelValue(server.voiceCategoryId)}</span></p>
            </div>
          </section>
          <section className="rounded-lg border border-border bg-panel p-5">
            <h2 className="font-semibold text-white">Preferências do bot</h2>
            <div className="mt-5 space-y-4 text-sm">
              <p className="flex justify-between gap-4"><span className="text-muted">Moeda</span><span className="text-white">{server.currency}</span></p>
              <p className="flex justify-between gap-4"><span className="text-muted">Símbolo</span><span className="text-white">{server.currencySymbol}</span></p>
              <p className="flex justify-between gap-4"><span className="text-muted">Idioma</span><Badge tone="discord">{server.language}</Badge></p>
              <p className="flex justify-between gap-4"><span className="text-muted">Plano</span><Badge tone="discord">{server.plan}</Badge></p>
            </div>
          </section>
        </div>
      )}
    </DashboardShell>
  );
}
