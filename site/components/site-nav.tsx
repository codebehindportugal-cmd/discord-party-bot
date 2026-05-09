import Link from "next/link";
import { Bot, Gauge, ShieldCheck } from "lucide-react";
import { AuthButton } from "@/components/auth-button";
import { ButtonLink } from "@/components/ui";

const nav = [
  { href: "/pricing", label: "Preços" },
  { href: "/docs", label: "Comandos" },
  { href: "/status", label: "Status" }
];

export function SiteNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-3 font-semibold text-white">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-discord">
            <Bot size={20} />
          </span>
          Party Loot
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-slate-300 md:flex">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-white">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/admin" className="hidden items-center gap-2 text-sm text-slate-300 hover:text-white sm:flex">
            <ShieldCheck size={16} />
            Admin
          </Link>
          <AuthButton />
          <ButtonLink href="/dashboard">
            <Gauge className="mr-2" size={16} />
            Dashboard
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}
