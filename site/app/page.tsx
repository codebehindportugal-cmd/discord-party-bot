import { Activity, CalendarCheck, Clock3, Coins, ShieldCheck, Waves } from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { BrandLogo } from "@/components/brand-logo";
import { Badge, ButtonLink, SectionTitle } from "@/components/ui";
import { plans } from "@/lib/plans";

const features = [
  { icon: CalendarCheck, title: "Eventos sem caos", text: "Cria raids, gere vagas e mantem inscricoes organizadas por jogo e classe." },
  { icon: Clock3, title: "Tempo real", text: "Regista entradas, saidas, pausas e crashes durante cada evento." },
  { icon: Coins, title: "Split automatico", text: "Divide loot por tempo, bonus de role, caps e regras do teu servidor." },
  { icon: Activity, title: "Painel de comando", text: "Historico, rankings, eventos e configuracoes num dashboard proprio." }
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <SiteNav />
      <main>
        <section className="grid-bg border-b border-border">
          <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-12 px-4 py-14 md:px-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div>
              <Badge tone="discord">Bot de raid e loot</Badge>
              <h1 className="mt-6 max-w-4xl text-5xl font-semibold leading-tight text-white md:text-7xl">MordFocas</h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
                O bot para servidores que querem eventos afiados, tracking de voz e divisao de loot sem folhas perdidas nem contas feitas a pressa.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href="/install">Instalar bot</ButtonLink>
                <ButtonLink href="/dashboard" variant="secondary">Abrir dashboard</ButtonLink>
              </div>
            </div>

            <div className="depth-stage min-h-[560px] rounded-lg border border-white/10 p-6 shadow-glow md:p-10">
              <div className="relative z-10 grid min-h-[500px] content-between">
                <div className="logo-orbit mx-auto mt-4 aspect-square w-full max-w-[430px] overflow-hidden rounded-lg border border-white/15 bg-black/40 shadow-2xl">
                  <BrandLogo className="h-full w-full text-6xl" alt="Logo MordFocas" />
                </div>

                <div className="logo-orbit mx-auto mt-8 w-full max-w-xl rounded-lg border border-white/10 bg-black/45 p-4 backdrop-blur">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-muted">Evento ativo</p>
                      <p className="mt-1 text-xl font-semibold text-white">Depth Run</p>
                    </div>
                    <Badge tone="success">Live</Badge>
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    {[
                      ["Tempo", "2h 14m"],
                      ["Loot", "840k"],
                      ["Players", "18"]
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-md border border-white/10 bg-white/[0.04] p-3">
                        <p className="text-xs uppercase text-muted">{label}</p>
                        <p className="mt-2 text-lg font-semibold text-white">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-20 md:px-6">
          <SectionTitle eyebrow="Sistema" title="Um bot com presenca propria" text="MordFocas liga o servidor, os eventos e o dashboard numa experiencia mais visual, rapida e facil de auditar." />
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div key={feature.title} className="rounded-lg border border-border bg-panel p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                <feature.icon className="text-discord" size={24} />
                <h3 className="mt-5 font-semibold text-white">{feature.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">{feature.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-y border-border bg-panel/45">
          <div className="mx-auto max-w-7xl px-4 py-20 md:px-6">
            <SectionTitle eyebrow="Planos" title="Escala com o teu servidor" />
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {plans.map((plan) => (
                <div key={plan.name} className={`rounded-lg border p-6 ${plan.highlight ? "border-discord bg-discord/10 shadow-glow" : "border-border bg-panel"}`}>
                  <h3 className="text-xl font-semibold text-white">{plan.name}</h3>
                  <p className="mt-4 text-4xl font-semibold text-white">{plan.price} EUR<span className="text-base text-muted">/mes</span></p>
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
              <h2 className="mt-4 text-2xl font-semibold text-white">Instalacao guiada</h2>
              <p className="mt-2 max-w-2xl text-slate-300">Liga o bot ao Discord, configura os canais e publica os comandos slash em poucos passos.</p>
            </div>
            <div className="mt-6 md:mt-0">
              <ButtonLink href="/install">
                <Waves className="mr-2" size={16} />
                Ver instalacao
              </ButtonLink>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
