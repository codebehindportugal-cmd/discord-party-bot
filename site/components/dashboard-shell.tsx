import Link from "next/link";
import { CalendarDays, CreditCard, Gauge, Settings, Shield, Users } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { Badge } from "@/components/ui";

const links = [
  { href: "/dashboard", label: "Visao geral", icon: Gauge },
  { href: "/dashboard/events", label: "Eventos", icon: CalendarDays },
  { href: "/dashboard/players", label: "Jogadores", icon: Users },
  { href: "/dashboard/settings", label: "Configuracoes", icon: Settings },
  { href: "/dashboard/billing", label: "Subscricao", icon: CreditCard },
  { href: "/admin", label: "Super-admin", icon: Shield }
];

export function DashboardShell({
  children,
  serverName = "Sem servidor selecionado",
  plan = "FREE"
}: {
  children: React.ReactNode;
  serverName?: string;
  plan?: string;
}) {
  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-border bg-panel/95 p-5 lg:block">
        <Link href="/" className="flex items-center gap-3 text-lg font-semibold text-white">
          <span className="relative flex h-10 w-10 overflow-hidden rounded-md border border-white/10 bg-panelSoft">
            <BrandLogo />
          </span>
          MordFocas
        </Link>
        <div className="mt-8 rounded-lg border border-border bg-panelSoft p-4">
          <p className="text-sm text-muted">Servidor</p>
          <p className="mt-1 font-semibold text-white">{serverName}</p>
          <div className="mt-3">
            <Badge tone="discord">{plan}</Badge>
          </div>
        </div>
        <nav className="mt-6 space-y-1">
          {links.map((item) => (
            <Link key={item.href} href={item.href} className="flex min-h-11 items-center gap-3 rounded-md px-3 text-sm text-slate-300 hover:bg-panelSoft hover:text-white">
              <item.icon size={18} />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="lg:pl-72">
        <div className="border-b border-border bg-panel/70 px-4 py-4 backdrop-blur lg:hidden">
          <Link href="/" className="font-semibold text-white">MordFocas</Link>
        </div>
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">{children}</div>
      </main>
    </div>
  );
}
