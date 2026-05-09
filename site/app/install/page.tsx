import type { Metadata } from "next";
import { CheckCircle2, ExternalLink, Gamepad2, Gauge, Server, ShieldCheck } from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { Badge, ButtonLink, SectionTitle } from "@/components/ui";

export const metadata: Metadata = {
  title: "Instalar MordsFocas",
  description: "Guia para adicionar o bot oficial MordsFocas a um servidor Discord."
};

const botInviteUrl = process.env.NEXT_PUBLIC_BOT_INVITE_URL || "/dashboard/billing";

const steps = [
  {
    icon: ShieldCheck,
    title: "1. Escolhe a subscricao",
    text: "A subscricao ativa o acesso ao MordsFocas no servidor que escolheres. O plano define limites de jogadores, eventos, jogos e funcionalidades."
  },
  {
    icon: ExternalLink,
    title: "2. Convida o bot oficial",
    text: "Usa o link de convite do MordsFocas. Nao precisas criar uma aplicacao Discord, token ou bot proprio."
  },
  {
    icon: Server,
    title: "3. Seleciona o servidor",
    text: "Escolhe o servidor Discord onde queres instalar o bot. Tens de ter permissoes de administrador nesse servidor."
  },
  {
    icon: Gauge,
    title: "4. Abre o dashboard",
    text: "Depois do bot entrar, o servidor aparece no dashboard. O dono da subscricao ve os dados dos servidores a que tem acesso."
  }
];

const permissions = [
  "Enviar mensagens e embeds",
  "Usar slash commands",
  "Ler canais configurados",
  "Gerir canais de eventos quando permitido",
  "Ver estados de voz para tracking",
  "Enviar mensagens diretas de notificacao"
];

export default function InstallPage() {
  return (
    <div>
      <SiteNav />
      <main>
        <section className="grid-bg border-b border-border">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 md:px-6 lg:grid-cols-[1fr_0.75fr]">
            <div>
              <Badge tone="discord">Bot oficial</Badge>
              <SectionTitle
                title="Instalar MordsFocas no teu servidor"
                text="Esta pagina e para adicionar o bot oficial ao Discord. Quem compra uma subscricao pode usar o bot no servidor escolhido e acompanhar os dados no dashboard."
              />
              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href={botInviteUrl}>Convidar bot</ButtonLink>
                <ButtonLink href="/pricing" variant="secondary">Ver planos</ButtonLink>
              </div>
            </div>

            <div className="depth-stage holo-panel min-h-[360px] rounded-lg border border-white/10 p-6 shadow-glow">
              <div className="energy-ring" />
              <div className="relative z-10">
                <Gamepad2 className="text-discord" size={32} />
                <h2 className="mt-5 text-2xl font-semibold text-white">Fluxo de acesso</h2>
                <div className="mt-6 space-y-3 text-sm text-slate-300">
                  <p className="rounded-md border border-white/10 bg-black/35 p-3">Cliente compra ou ativa plano</p>
                  <p className="rounded-md border border-white/10 bg-black/35 p-3">Bot e instalado no servidor Discord</p>
                  <p className="rounded-md border border-white/10 bg-black/35 p-3">Dashboard mostra eventos, players e loot desse servidor</p>
                  <p className="rounded-md border border-white/10 bg-black/35 p-3">Super-admin gere todos os servidores e subscricoes</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-6 px-4 py-14 md:px-6 lg:grid-cols-[1fr_0.72fr]">
          <div className="space-y-4">
            {steps.map((step) => (
              <div key={step.title} className="game-card rounded-lg border border-border bg-panel p-6">
                <step.icon className="text-discord" size={24} />
                <h2 className="mt-4 text-xl font-semibold text-white">{step.title}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-300">{step.text}</p>
              </div>
            ))}
          </div>

          <aside className="space-y-4">
            <div className="rounded-lg border border-border bg-panel p-6">
              <h2 className="text-xl font-semibold text-white">Quem ve o que?</h2>
              <div className="mt-5 space-y-4 text-sm leading-7 text-slate-300">
                <p><strong className="text-white">Cliente:</strong> ve os servidores onde tem acesso/subscricao ativa e os dados recolhidos pelo bot nesses servidores.</p>
                <p><strong className="text-white">Super-admin:</strong> ve tudo, sincroniza servidores, atribui planos e gere pagamentos/subscricoes.</p>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-panel p-6">
              <h2 className="text-xl font-semibold text-white">Permissoes pedidas</h2>
              <div className="mt-5 space-y-3">
                {permissions.map((permission) => (
                  <p key={permission} className="flex items-center gap-3 text-sm text-slate-300">
                    <CheckCircle2 className="text-success" size={16} />
                    {permission}
                  </p>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-warning/30 bg-warning/10 p-6">
              <h2 className="text-xl font-semibold text-white">Nota</h2>
              <p className="mt-3 text-sm leading-7 text-slate-200">
                Se o servidor nao aparecer depois da instalacao, o super-admin pode usar o botao Sincronizar servidores no painel admin.
              </p>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}
