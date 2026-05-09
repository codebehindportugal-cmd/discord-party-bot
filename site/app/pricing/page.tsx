import { SiteNav } from "@/components/site-nav";
import { ButtonLink, SectionTitle } from "@/components/ui";
import { plans } from "@/lib/plans";

export default function PricingPage() {
  return (
    <div>
      <SiteNav />
      <main className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <SectionTitle title="Preços" text="Planos mensais para cada tamanho de servidor Discord." />
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {plans.map((plan) => (
            <div key={plan.name} className={`rounded-lg border p-6 ${plan.highlight ? "border-discord bg-discord/10" : "border-border bg-panel"}`}>
              <h2 className="text-xl font-semibold text-white">{plan.name}</h2>
              <p className="mt-4 text-4xl font-semibold">{plan.price}€<span className="text-base text-muted">/mês</span></p>
              <div className="mt-6 space-y-3 text-sm text-slate-300">
                <p>{plan.events}</p>
                <p>{plan.players}</p>
                <p>{plan.games}</p>
              </div>
              <div className="mt-8">
                <ButtonLink href="/dashboard/billing" variant={plan.highlight ? "primary" : "secondary"}>Escolher plano</ButtonLink>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
