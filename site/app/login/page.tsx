"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { Bot, LogIn, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { SiteNav } from "@/components/site-nav";

type Mode = "login" | "register";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      if (mode === "register") {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();
        if (!response.ok) {
          setMessage(data.error || "Não foi possível criar conta.");
          return;
        }
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: "/dashboard"
      });

      if (!result) {
        setMessage("Nao foi possivel contactar a autenticacao. Tenta novamente.");
        return;
      }

      if (result.error) {
        setMessage("Email ou password incorretos.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ocorreu um erro inesperado. Tenta novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen">
      <SiteNav />
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl items-center justify-center px-4 py-16">
        <section className="w-full max-w-md rounded-lg border border-border bg-panel p-8 shadow-glow">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-md bg-discord">
            <Bot size={28} />
          </div>
          <h1 className="mt-6 text-center text-3xl font-semibold text-white">
            {mode === "login" ? "Entrar no dashboard" : "Criar conta"}
          </h1>
          <p className="mt-3 text-center text-sm leading-6 text-slate-300">
            {mode === "login"
              ? "Entra com a tua conta do site para gerir servidores, jogos e subscrições."
              : "Cria uma conta para aceder ao painel. A primeira conta fica admin."}
          </p>

          <div className="mt-8 grid grid-cols-2 rounded-md border border-border bg-panelSoft p-1">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`min-h-10 rounded-md text-sm font-semibold ${mode === "login" ? "bg-discord text-white" : "text-slate-300"}`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => setMode("register")}
              className={`min-h-10 rounded-md text-sm font-semibold ${mode === "register" ? "bg-discord text-white" : "text-slate-300"}`}
            >
              Criar conta
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {mode === "register" ? (
              <label className="block text-sm text-slate-300">
                Nome
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="mt-2 min-h-11 w-full rounded-md border border-border bg-panelSoft px-3 text-white outline-none focus:border-discord"
                  placeholder="O teu nome"
                />
              </label>
            ) : null}

            <label className="block text-sm text-slate-300">
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="mt-2 min-h-11 w-full rounded-md border border-border bg-panelSoft px-3 text-white outline-none focus:border-discord"
                placeholder="admin@exemplo.com"
              />
            </label>

            <label className="block text-sm text-slate-300">
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={8}
                className="mt-2 min-h-11 w-full rounded-md border border-border bg-panelSoft px-3 text-white outline-none focus:border-discord"
                placeholder="mínimo 8 caracteres"
              />
            </label>

            {message ? (
              <div className="rounded-md border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{message}</div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-discord px-4 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {mode === "login" ? <LogIn className="mr-2" size={18} /> : <UserPlus className="mr-2" size={18} />}
              {loading ? "A processar..." : mode === "login" ? "Entrar" : "Criar conta"}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
