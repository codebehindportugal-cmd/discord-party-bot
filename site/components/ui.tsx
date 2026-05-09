import Link from "next/link";
import { cn } from "@/lib/utils";

export function Badge({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "success" | "warning" | "danger" | "discord" }) {
  const tones = {
    default: "border-slate-600 bg-slate-800/70 text-slate-200",
    success: "border-success/30 bg-success/10 text-success",
    warning: "border-warning/30 bg-warning/10 text-warning",
    danger: "border-danger/30 bg-danger/10 text-danger",
    discord: "border-discord/30 bg-discord/10 text-indigo-200"
  };

  return <span className={cn("inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium", tones[tone])}>{children}</span>;
}

export function ButtonLink({ href, children, variant = "primary" }: { href: string; children: React.ReactNode; variant?: "primary" | "secondary" }) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex min-h-10 items-center justify-center rounded-md px-4 text-sm font-semibold transition",
        variant === "primary" ? "bg-discord text-white hover:bg-indigo-500" : "border border-border bg-panelSoft text-slate-100 hover:border-slate-500"
      )}
    >
      {children}
    </Link>
  );
}

export function StatCard({ label, value, helper }: { label: string; value: string; helper?: string }) {
  return (
    <div className="rounded-lg border border-border bg-panel p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      {helper ? <p className="mt-2 text-sm text-slate-400">{helper}</p> : null}
    </div>
  );
}

export function SectionTitle({ eyebrow, title, text }: { eyebrow?: string; title: string; text?: string }) {
  return (
    <div className="max-w-3xl">
      {eyebrow ? <p className="text-sm font-semibold uppercase tracking-[0.18em] text-discord">{eyebrow}</p> : null}
      <h2 className="mt-3 text-3xl font-semibold text-white md:text-4xl">{title}</h2>
      {text ? <p className="mt-4 text-base leading-7 text-slate-300">{text}</p> : null}
    </div>
  );
}
