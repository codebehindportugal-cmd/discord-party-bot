import { Activity, Bot, CalendarCheck, Clock3, Coins, ShieldCheck } from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { Badge, ButtonLink, SectionTitle } from "@/components/ui";
import { plans } from "@/lib/plans";

const features = [
  { icon: CalendarCheck, title: "Eventos de raid", text: "Cria eventos, anuncia no Discord e acompanha presenças por jogo." },
  { icon: Clock3, title: "Tracking de voice", text: "Regista entradas, saídas, crashes e pausas durante cada evento." },
  { icon: Coins, title: "Split automático", text: "Divide gold por tempo, role bonus, tempo mínimo e cap por jogador." },
  { icon: Activity, title: "Dashboard vivo", text: "Visualiza rankings, históricos, gráficos e detalhe de cada split." }
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <SiteNav />
      <main>
        <section className="grid-bg border-b border-border">
          <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-10 px-4 py-16 md:px-6 lg:grid-cols-[1fr_0.9fr]">
            <div>
              <Badge tone="discord">Discord loot management</Badge>
              <h1 className="mt-6 max-w-4xl text-5xl font-semibold leading-tight text-white md:text-7xl">Party Loot Bot</h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
                Gestão de eventos, voice tracking e divisão de loot para guilds que querem menos folhas de cálculo e mais raid.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href="/dashboard">Abrir dashboard</ButtonLink>
                <ButtonLink href="/docs" variant="secondary">Ver comandos</ButtonLink>
              </div>
            </div>
            <div className="rounded-lg border border-border bg-panel p-4 shadow-glow">
              <div className="rounded-md border border-border bg-[#0f1422] p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted">Evento ativo</p>
                    <p className="mt-1 text-xl font-semibold text-white">Alexander Savage</p>
                  </div>
                  <Badge tone="success">Tracking</Badge>
                </div>
                <div className="mt-6 space-y-4">
                  {[
                    ["Ariana", "HEAL", "2h 00m", "50%"],
                    ["Mendes", "TANK", "1h 30m", "37.5%"],
                    ["Noct", "DPS", "30m", "12.5%"]
                  ].map((row) => (
                    <div key={row[0]} className="grid grid-cols-[1fr_auto] gap-3 rounded-md border border-border bg-panelSoft p-3">
                      <div>
                        <p className="font-medium text-white">{row[0]}</p>
                        <p className="text-sm text-muted">{row[1]} - {row[2]}</p>
                      </div>
                      <p className="font-semibold text-gold">{row[3]}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-20 md:px-6">
          <SectionTitle eyebrow="Features" title="Tudo ligado entre bot, dashboard e subscrição" text="O site controla planos, configurações e relatórios. O bot continua rápido no Discord, mas deixa o histórico organizado para admins." />
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div key={feature.title} className="rounded-lg border border-border bg-panel p-5">
                <feature.icon className="text-discord" size={24} />
                <h3 className="mt-5 font-semibold text-white">{feature.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">{feature.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-y border-border bg-panel/45">
          <div className="mx-auto max-w-7xl px-4 py-20 md:px-6">
            <SectionTitle eyebrow="Planos" title="Do servidor pequeno à guild premium" />
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {plans.map((plan) => (
                <div key={plan.name} className={`rounded-lg border p-6 ${plan.highlight ? "border-discord bg-discord/10" : "border-border bg-panel"}`}>
                  <h3 className="text-xl font-semibold text-white">{plan.name}</h3>
                  <p className="mt-4 text-4xl font-semibold text-white">{plan.price}€<span className="text-base text-muted">/mês</span></p>
                  <ul className="mt-6 space-y-3 text-sm text-slate-300">
                    <li>{plan.events}</li>
                    <li>{plan.players}</li>
                    <li>{plan.games}</li>
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
          <div className="rounded-lg border border-border bg-panel p-8 md:flex md:items-center md:justify-between">
            <div>
              <ShieldCheck className="text-success" />
              <h2 className="mt-4 text-2xl font-semibold text-white">API interna pronta para o bot</h2>
              <p className="mt-2 max-w-2xl text-slate-300">Endpoints com `x-api-key` para consultar plano, sincronizar eventos e guardar splits concluídos.</p>
            </div>
            <div className="mt-6 md:mt-0">
              <ButtonLink href="/docs">Ver integração</ButtonLink>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
