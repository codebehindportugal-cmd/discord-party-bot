import { SiteNav } from "@/components/site-nav";
import { Badge, SectionTitle } from "@/components/ui";

const commands = [
  ["/criar-evento", "Cria raid, dungeon ou party com vagas e jogo."],
  ["/iniciar-evento", "Cria canal de voz temporário e começa o tracking."],
  ["/ver-tempo", "Mostra tabela de tempo por jogador em tempo real."],
  ["/adicionar-loot", "Regista gold ou item obtido durante o evento."],
  ["/confirmar-split", "Fecha o cálculo, publica embed e envia DMs."],
  ["/config-canal", "Configura canais de anúncios, eventos e logs."]
];

export default function DocsPage() {
  return (
    <div>
      <SiteNav />
      <main className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <SectionTitle title="Documentação dos comandos" text="Guia rápido para administradores ligarem o bot ao fluxo de eventos." />
        <div className="mt-10 overflow-hidden rounded-lg border border-border">
          <table className="w-full border-collapse bg-panel text-left text-sm">
            <thead className="bg-panelSoft text-slate-300">
              <tr>
                <th className="p-4">Comando</th>
                <th className="p-4">Função</th>
              </tr>
            </thead>
            <tbody>
              {commands.map(([command, text]) => (
                <tr key={command} className="border-t border-border">
                  <td className="p-4"><Badge tone="discord">{command}</Badge></td>
                  <td className="p-4 text-slate-300">{text}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-8 rounded-lg border border-border bg-panel p-5">
          <h2 className="font-semibold text-white">API do bot</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">Usa o header `x-api-key` com o mesmo segredo de `SITE_API_KEY` no bot. Endpoints: `GET /api/bot/server/:discordId`, `POST /api/bot/event`, `PUT /api/bot/event/:id`, `POST /api/bot/split`, `GET /api/bot/players/:serverId`.</p>
        </div>
      </main>
    </div>
  );
}
