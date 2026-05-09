"use client";

import { useMemo, useState } from "react";
import { Badge, StatCard } from "@/components/ui";

type PlanName = "FREE" | "PRO" | "PREMIUM";
type RoleName = "TANK" | "HEAL" | "DPS" | "SUPPORT";
type PaymentMethod = "CASH" | "PAYPAL" | "REVOLUT";

type ServerRow = {
  id: string;
  discordId: string;
  name: string;
  plan: string;
  status: string;
  events: number;
  expiresAt: string | null;
  features: Record<string, boolean>;
};

type GameRow = {
  id: string;
  name: string;
  emoji: string;
  active: boolean;
  classes: Array<{ id: string; name: string; role: string; emoji: string }>;
};

function getDefaultExpiryDate() {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  return date.toISOString().slice(0, 10);
}

export function AdminConsole({
  initialServers,
  initialGames,
  showDevAccessWarning
}: {
  initialServers: ServerRow[];
  initialGames: GameRow[];
  showDevAccessWarning: boolean;
}) {
  const [servers, setServers] = useState<ServerRow[]>(initialServers);
  const [games, setGames] = useState<GameRow[]>(initialGames);
  const [selectedServerId, setSelectedServerId] = useState(initialServers[0]?.id || "");
  const [selectedGameId, setSelectedGameId] = useState(initialGames[0]?.id || "");
  const [plan, setPlan] = useState<PlanName>("PRO");
  const [expiresAt, setExpiresAt] = useState(getDefaultExpiryDate());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [amount, setAmount] = useState("9");
  const [paymentReference, setPaymentReference] = useState("");
  const [spamLimit, setSpamLimit] = useState("5");
  const [spamWindow, setSpamWindow] = useState("10");
  const [gameName, setGameName] = useState("");
  const [gameEmoji, setGameEmoji] = useState("🎮");
  const [className, setClassName] = useState("");
  const [classRole, setClassRole] = useState<RoleName>("DPS");
  const [classEmoji, setClassEmoji] = useState("⚔️");
  const [message, setMessage] = useState("");

  const mrr = useMemo(() => {
    const prices: Record<string, number> = { FREE: 0, PRO: 9, PREMIUM: 19 };
    return servers.reduce((total, server) => total + (prices[server.plan] || 0), 0);
  }, [servers]);

  async function persist(path: string, payload: unknown) {
    await fetch(path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    }).catch(() => null);
  }

  async function applyPlan() {
    setServers((current) =>
      current.map((server) =>
        server.id === selectedServerId
          ? { ...server, plan, status: plan === "FREE" ? "active" : "active", expiresAt: plan === "FREE" ? null : expiresAt }
          : server
      )
    );
    await persist("/api/admin/subscriptions", {
      serverId: selectedServerId,
      plan,
      expiresAt,
      paymentMethod,
      amount: Number(amount || 0),
      paymentReference
    });
    setMessage("Subscrição e pagamento registados. O bot passa a receber este acesso pela API do site.");
  }

  async function addGame() {
    if (!gameName.trim()) return;
    const game = {
      id: gameName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      name: gameName.trim(),
      emoji: gameEmoji,
      active: true,
      classes: []
    };
    setGames((current) => [game, ...current]);
    setSelectedGameId(game.id);
    setGameName("");
    await persist("/api/admin/games", game);
    setMessage("Jogo global criado. Pode ser usado pelos servidores com plano permitido.");
  }

  async function addClass() {
    if (!className.trim()) return;
    const classRow = {
      id: className.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      name: className.trim(),
      role: classRole,
      emoji: classEmoji
    };
    setGames((current) =>
      current.map((game) =>
        game.id === selectedGameId ? { ...game, classes: [classRow, ...game.classes] } : game
      )
    );
    setClassName("");
    await persist("/api/admin/classes", { gameId: selectedGameId, ...classRow });
    setMessage("Classe adicionada ao jogo global.");
  }

  async function toggleFeature(key: "antispam" | "albion", enabled: boolean) {
    setServers((current) =>
      current.map((server) =>
        server.id === selectedServerId
          ? { ...server, features: { ...server.features, [key]: enabled } }
          : server
      )
    );

    await persist("/api/admin/features", {
      serverId: selectedServerId,
      key,
      enabled,
      config: key === "antispam"
        ? { messageLimit: Number(spamLimit || 5), timeWindowSeconds: Number(spamWindow || 10) }
        : {}
    });
    setMessage("Módulo atualizado. O bot lê esta configuração na base de dados do site.");
  }

  return (
    <div>
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-discord">Super-admin</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Acessos, jogos e classes</h1>
        </div>
        {showDevAccessWarning ? <Badge tone="warning">SUPER_ADMIN_EMAILS vazio</Badge> : <Badge tone="success">Acesso restrito</Badge>}
      </div>

      {message ? (
        <div className="mt-5 rounded-lg border border-success/30 bg-success/10 p-4 text-sm text-success">{message}</div>
      ) : null}

      <div className="mt-8 grid gap-4 md:grid-cols-4">
        <StatCard label="MRR demo" value={`${mrr}€`} helper="Com base nos planos atribuídos" />
        <StatCard label="Servidores" value={String(servers.length)} />
        <StatCard label="Jogos globais" value={String(games.length)} />
        <StatCard label="Classes globais" value={String(games.reduce((total, game) => total + game.classes.length, 0))} />
      </div>

      <div className="mt-8 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-lg border border-border bg-panel p-5">
          <h2 className="font-semibold text-white">Dar acesso por subscrição</h2>
          {servers.length === 0 ? (
            <div className="mt-5 rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm text-warning">
              Ainda não há servidores na BD. Liga o bot ou corre o script de sincronização de servidores.
            </div>
          ) : null}
          <div className="mt-5 grid gap-4">
            <label className="text-sm text-slate-300">
              Servidor Discord
              <select value={selectedServerId} onChange={(event) => setSelectedServerId(event.target.value)} className="mt-2 min-h-11 w-full rounded-md border border-border bg-panelSoft px-3 text-white">
                {servers.map((server) => (
                  <option key={server.id} value={server.id}>{server.name} - {server.discordId}</option>
                ))}
              </select>
            </label>
            <label className="text-sm text-slate-300">
              Plano
              <select value={plan} onChange={(event) => setPlan(event.target.value as PlanName)} className="mt-2 min-h-11 w-full rounded-md border border-border bg-panelSoft px-3 text-white">
                <option value="FREE">Free</option>
                <option value="PRO">Pro</option>
                <option value="PREMIUM">Premium</option>
              </select>
            </label>
            <label className="text-sm text-slate-300">
              Acesso até
              <input type="date" value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} className="mt-2 min-h-11 w-full rounded-md border border-border bg-panelSoft px-3 text-white" />
            </label>
            <label className="text-sm text-slate-300">
              Pagamento
              <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)} className="mt-2 min-h-11 w-full rounded-md border border-border bg-panelSoft px-3 text-white">
                <option value="CASH">Dinheiro</option>
                <option value="PAYPAL">PayPal</option>
                <option value="REVOLUT">Revolut</option>
              </select>
            </label>
            <label className="text-sm text-slate-300">
              Valor pago (€)
              <input type="number" min="0" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} className="mt-2 min-h-11 w-full rounded-md border border-border bg-panelSoft px-3 text-white" />
            </label>
            <label className="text-sm text-slate-300">
              Referência / nota
              <input value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} placeholder="PayPal email, Revolut tag ou recibo" className="mt-2 min-h-11 w-full rounded-md border border-border bg-panelSoft px-3 text-white placeholder:text-muted" />
            </label>
            <button type="button" onClick={applyPlan} disabled={!selectedServerId} className="min-h-11 rounded-md bg-discord px-4 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60">
              Guardar subscrição
            </button>
          </div>
        </section>

        <section className="rounded-lg border border-border bg-panel p-5">
          <h2 className="font-semibold text-white">Servidores registados</h2>
          <div className="mt-5 overflow-hidden rounded-lg border border-border">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-panelSoft text-slate-300">
                <tr>
                  <th className="p-3">Servidor</th>
                  <th className="p-3">Plano</th>
                  <th className="p-3">Acesso</th>
                </tr>
              </thead>
              <tbody>
                {servers.map((server) => (
                  <tr key={server.id} className="border-t border-border">
                    <td className="p-3 text-white">{server.name}</td>
                    <td className="p-3"><Badge tone="discord">{server.plan}</Badge></td>
                    <td className="p-3 text-slate-300">{server.expiresAt || "Sem expiração"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="mt-8 rounded-lg border border-border bg-panel p-5">
        <h2 className="font-semibold text-white">Módulos do bot por servidor</h2>
        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr]">
          <label className="text-sm text-slate-300">
            Servidor
            <select value={selectedServerId} onChange={(event) => setSelectedServerId(event.target.value)} className="mt-2 min-h-11 w-full rounded-md border border-border bg-panelSoft px-3 text-white">
              {servers.map((server) => (
                <option key={server.id} value={server.id}>{server.name}</option>
              ))}
            </select>
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex min-h-11 items-center justify-between gap-3 rounded-md border border-border bg-panelSoft px-3 text-sm text-white">
              <span>Anti-spam</span>
              <input type="checkbox" checked={Boolean(servers.find((server) => server.id === selectedServerId)?.features?.antispam)} onChange={(event) => toggleFeature("antispam", event.target.checked)} />
            </label>
            <label className="flex min-h-11 items-center justify-between gap-3 rounded-md border border-border bg-panelSoft px-3 text-sm text-white">
              <span>Albion Online</span>
              <input type="checkbox" checked={Boolean(servers.find((server) => server.id === selectedServerId)?.features?.albion)} onChange={(event) => toggleFeature("albion", event.target.checked)} />
            </label>
          </div>
          <label className="text-sm text-slate-300">
            Limite anti-spam
            <input type="number" min="2" max="20" value={spamLimit} onChange={(event) => setSpamLimit(event.target.value)} className="mt-2 min-h-11 w-full rounded-md border border-border bg-panelSoft px-3 text-white" />
          </label>
          <label className="text-sm text-slate-300">
            Janela anti-spam (segundos)
            <input type="number" min="3" max="60" value={spamWindow} onChange={(event) => setSpamWindow(event.target.value)} className="mt-2 min-h-11 w-full rounded-md border border-border bg-panelSoft px-3 text-white" />
          </label>
        </div>
      </section>

      <div className="mt-8 grid gap-4 xl:grid-cols-2">
        <section className="rounded-lg border border-border bg-panel p-5">
          <h2 className="font-semibold text-white">Criar jogo global</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_120px]">
            <input value={gameName} onChange={(event) => setGameName(event.target.value)} placeholder="Nome do jogo" className="min-h-11 rounded-md border border-border bg-panelSoft px-3 text-white placeholder:text-muted" />
            <select value={gameEmoji} onChange={(event) => setGameEmoji(event.target.value)} className="min-h-11 rounded-md border border-border bg-panelSoft px-3 text-white">
              <option value="🎮">🎮</option>
              <option value="⚔️">⚔️</option>
              <option value="✨">✨</option>
              <option value="🛡️">🛡️</option>
              <option value="🐉">🐉</option>
            </select>
          </div>
          <button type="button" onClick={addGame} className="mt-4 min-h-11 rounded-md bg-discord px-4 text-sm font-semibold text-white hover:bg-indigo-500">
            Criar jogo
          </button>
        </section>

        <section className="rounded-lg border border-border bg-panel p-5">
          <h2 className="font-semibold text-white">Criar classe</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <select value={selectedGameId} onChange={(event) => setSelectedGameId(event.target.value)} className="min-h-11 rounded-md border border-border bg-panelSoft px-3 text-white">
              {!games.length ? <option value="">Sem jogos</option> : null}
              {games.map((game) => <option key={game.id} value={game.id}>{game.emoji} {game.name}</option>)}
            </select>
            <input value={className} onChange={(event) => setClassName(event.target.value)} placeholder="Nome da classe" className="min-h-11 rounded-md border border-border bg-panelSoft px-3 text-white placeholder:text-muted" />
            <select value={classRole} onChange={(event) => setClassRole(event.target.value as RoleName)} className="min-h-11 rounded-md border border-border bg-panelSoft px-3 text-white">
              <option value="TANK">Tank</option>
              <option value="HEAL">Heal</option>
              <option value="DPS">DPS</option>
              <option value="SUPPORT">Support</option>
            </select>
            <select value={classEmoji} onChange={(event) => setClassEmoji(event.target.value)} className="min-h-11 rounded-md border border-border bg-panelSoft px-3 text-white">
              <option value="🛡️">🛡️</option>
              <option value="💚">💚</option>
              <option value="⚔️">⚔️</option>
              <option value="🔮">🔮</option>
              <option value="🔥">🔥</option>
            </select>
          </div>
          <button type="button" onClick={addClass} disabled={!selectedGameId} className="mt-4 min-h-11 rounded-md bg-discord px-4 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60">
            Criar classe
          </button>
        </section>
      </div>

      <section className="mt-8 rounded-lg border border-border bg-panel p-5">
        <h2 className="font-semibold text-white">Jogos e classes globais</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {games.map((game) => (
            <article key={game.id} className="rounded-lg border border-border bg-panelSoft p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold text-white">{game.emoji} {game.name}</h3>
                <Badge tone={game.active ? "success" : "danger"}>{game.active ? "Ativo" : "Inativo"}</Badge>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {game.classes.map((item) => (
                  <Badge key={item.id} tone={item.role === "DPS" ? "warning" : "discord"}>{item.emoji} {item.name} · {item.role}</Badge>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
