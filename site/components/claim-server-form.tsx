"use client";

import { useState } from "react";
import { ButtonLink } from "@/components/ui";

export function ClaimServerForm() {
  const [discordId, setDiscordId] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function claimServer() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/dashboard/claim-server", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ discordId })
      });
      const payload = await response.json();

      if (!response.ok) {
        setMessage(payload.error || "Nao foi possivel associar o servidor.");
        return;
      }

      setMessage("Servidor associado a tua conta. A recarregar...");
      window.location.href = "/dashboard";
    } catch (error) {
      setMessage("Nao foi possivel associar o servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-lg border border-border bg-panel p-6">
      <h2 className="text-xl font-semibold text-white">Associar servidor a conta</h2>
      <p className="mt-3 text-sm leading-6 text-slate-300">
        Depois de instalares o MordsFocas no teu Discord, escreve o ID do servidor para ligares os dados a esta conta.
      </p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <input
          value={discordId}
          onChange={(event) => setDiscordId(event.target.value)}
          placeholder="Discord Server ID"
          className="min-h-11 flex-1 rounded-md border border-border bg-panelSoft px-3 text-white outline-none focus:border-discord"
        />
        <button
          type="button"
          onClick={claimServer}
          disabled={loading || !discordId.trim()}
          className="min-h-11 rounded-md bg-discord px-4 text-sm font-semibold text-white shadow-glow hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "A associar" : "Associar"}
        </button>
      </div>
      {message ? <p className="mt-4 text-sm text-slate-300">{message}</p> : null}
      <div className="mt-5">
        <ButtonLink href="/install" variant="secondary">Como instalar o bot</ButtonLink>
      </div>
    </section>
  );
}
