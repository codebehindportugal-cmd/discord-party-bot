import { SiteNav } from "@/components/site-nav";
import { Badge, SectionTitle, StatCard } from "@/components/ui";

export default function StatusPage() {
  return (
    <div>
      <SiteNav />
      <main className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <div className="flex items-start justify-between gap-4">
          <SectionTitle title="Status" text="Estado operacional do bot, dashboard e API interna." />
          <Badge tone="success">Operacional</Badge>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <StatCard label="Bot Discord" value="99.98%" helper="Últimos 30 dias" />
          <StatCard label="API interna" value="42 ms" helper="Latência média" />
          <StatCard label="Dashboard" value="0 incidentes" helper="Esta semana" />
        </div>
      </main>
    </div>
  );
}
