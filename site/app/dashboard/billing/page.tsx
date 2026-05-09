import { DashboardShell } from "@/components/dashboard-shell";
import { ClaimServerForm } from "@/components/claim-server-form";
import { Badge, ButtonLink } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { getCurrentUserServer } from "@/lib/user-server-access";

export const dynamic = "force-dynamic";

const plans = [
  { name: "FREE", price: 0, events: "1 evento ativo", players: "5 jogadores", games: "1 jogo" },
  { name: "PRO", price: 9, events: "Eventos ilimitados", players: "20 jogadores", games: "2 jogos" },
  { name: "PREMIUM", price: 19, events: "Tudo ilimitado", players: "Jogadores ilimitados", games: "Estatisticas avancadas" }
];

export default async function BillingPage() {
  const { server: currentServer } = await getCurrentUserServer();
  const server = currentServer
    ? await prisma.server.findUnique({
        where: { id: currentServer.id },
        include: {
          invoices: { orderBy: { createdAt: "desc" }, take: 10 },
          subscriptions: { include: { plan: true }, orderBy: { createdAt: "desc" }, take: 1 }
        }
      })
    : null;

  if (!server) {
    return (
      <DashboardShell>
        <h1 className="text-3xl font-semibold text-white">Subscricao</h1>
        <div className="mt-8">
          <ClaimServerForm />
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell serverName={server.name} plan={server.plan}>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white">Subscricao do servidor</h1>
          <p className="mt-2 text-slate-300">Plano atual para este servidor: <Badge tone="discord">{server.plan}</Badge></p>
        </div>
        <ButtonLink href="/api/stripe/portal">Portal Stripe</ButtonLink>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <div key={plan.name} className={`game-card rounded-lg border p-6 ${plan.name === server.plan ? "border-discord bg-discord/10" : "border-border bg-panel"}`}>
            <h2 className="text-xl font-semibold text-white">{plan.name}</h2>
            <p className="mt-4 text-3xl font-semibold text-white">{plan.price} EUR<span className="text-sm text-muted">/mes</span></p>
            <div className="mt-5 space-y-2 text-sm text-slate-300">
              <p>{plan.events}</p>
              <p>{plan.players}</p>
              <p>{plan.games}</p>
              <p>Dados do servidor onde o bot esta instalado</p>
            </div>
          </div>
        ))}
      </div>
      <section className="mt-8 overflow-hidden rounded-lg border border-border bg-panel">
        <div className="border-b border-border p-5">
          <h2 className="font-semibold text-white">Pagamentos registados</h2>
        </div>
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-panelSoft text-slate-300">
            <tr>
              <th className="p-4">Data</th>
              <th className="p-4">Metodo</th>
              <th className="p-4">Referencia</th>
              <th className="p-4">Valor</th>
            </tr>
          </thead>
          <tbody>
            {server.invoices.map((invoice) => (
              <tr key={invoice.id} className="border-t border-border">
                <td className="p-4 text-slate-300">{(invoice.paidAt || invoice.createdAt).toLocaleString("pt-PT")}</td>
                <td className="p-4 text-white">{invoice.paymentMethod}</td>
                <td className="p-4 text-slate-300">{invoice.paymentReference || "-"}</td>
                <td className="p-4 text-gold">{(invoice.amount / 100).toFixed(2)} {invoice.currency}</td>
              </tr>
            ))}
            {!server.invoices.length ? (
              <tr><td className="p-4 text-muted" colSpan={4}>Sem pagamentos registados.</td></tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </DashboardShell>
  );
}
