import type { Metadata } from "next";
import { CheckCircle2, ExternalLink, KeyRound, Server, TerminalSquare } from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { Badge, SectionTitle } from "@/components/ui";

export const metadata: Metadata = {
  title: "Instalar MordFocas",
  description: "Guia de instalacao do bot MordFocas no Discord e no servidor."
};

const steps = [
  {
    icon: KeyRound,
    title: "1. Criar a aplicacao no Discord",
    text: "No Discord Developer Portal, cria uma aplicacao, adiciona um Bot e copia o token. Guarda tambem o Application ID."
  },
  {
    icon: ExternalLink,
    title: "2. Convidar o bot",
    text: "Gera o link OAuth2 com scopes bot e applications.commands. Da permissoes para gerir canais, enviar mensagens, usar slash commands e ler estados de voz."
  },
  {
    icon: Server,
    title: "3. Configurar o servidor",
    text: "Define canais de anuncios, eventos e logs. Depois cria os jogos e classes que a tua comunidade usa."
  },
  {
    icon: TerminalSquare,
    title: "4. Publicar comandos",
    text: "No alojamento, define as variaveis de ambiente e corre npm run deploy-commands para registar os slash commands."
  }
];

const permissions = [
  "Send Messages",
  "Use Slash Commands",
  "Manage Channels",
  "View Channels",
  "Read Message History",
  "Connect",
  "View Server Insights"
];

export default function InstallPage() {
  return (
    <div>
      <SiteNav />
      <main>
        <section className="grid-bg border-b border-border">
          <div className="mx-auto max-w-7xl px-4 py-16 md:px-6">
            <Badge tone="discord">Instalacao</Badge>
            <SectionTitle
              title="Instalar MordFocas no teu servidor"
              text="Segue estes passos para ligar o bot ao Discord, publicar comandos slash e deixar o dashboard pronto para operar."
            />
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-6 px-4 py-14 md:px-6 lg:grid-cols-[1fr_0.72fr]">
          <div className="space-y-4">
            {steps.map((step) => (
              <div key={step.title} className="rounded-lg border border-border bg-panel p-6">
                <step.icon className="text-discord" size={24} />
                <h2 className="mt-4 text-xl font-semibold text-white">{step.title}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-300">{step.text}</p>
              </div>
            ))}
          </div>

          <aside className="space-y-4">
            <div className="rounded-lg border border-border bg-panel p-6">
              <h2 className="text-xl font-semibold text-white">Variaveis essenciais</h2>
              <div className="mt-5 space-y-3 text-sm text-slate-300">
                <p><code>DISCORD_TOKEN</code></p>
                <p><code>DISCORD_CLIENT_ID</code></p>
                <p><code>DATABASE_URL</code></p>
                <p><code>SITE_API_URL</code></p>
                <p><code>SITE_API_KEY</code></p>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-panel p-6">
              <h2 className="text-xl font-semibold text-white">Comandos no Plesk</h2>
              <pre className="mt-5 overflow-x-auto rounded-md border border-white/10 bg-black/45 p-4 text-xs leading-6 text-slate-200">
{`npm install
npm run db:generate
npm run db:push
npm run deploy-commands`}
              </pre>
            </div>

            <div className="rounded-lg border border-border bg-panel p-6">
              <h2 className="text-xl font-semibold text-white">Permissoes recomendadas</h2>
              <div className="mt-5 space-y-3">
                {permissions.map((permission) => (
                  <p key={permission} className="flex items-center gap-3 text-sm text-slate-300">
                    <CheckCircle2 className="text-success" size={16} />
                    {permission}
                  </p>
                ))}
              </div>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}
