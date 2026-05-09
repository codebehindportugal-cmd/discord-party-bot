"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { LogIn, LogOut } from "lucide-react";
import Link from "next/link";

export function AuthButton() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <span className="text-sm text-muted">...</span>;
  }

  if (session) {
    return (
      <button type="button" onClick={() => signOut({ callbackUrl: "/" })} className="inline-flex min-h-10 items-center rounded-md border border-border bg-panelSoft px-3 text-sm text-slate-100 hover:border-slate-500">
        <LogOut className="mr-2" size={16} />
        Sair
      </button>
    );
  }

  return (
    <Link href="/login" className="inline-flex min-h-10 items-center rounded-md border border-border bg-panelSoft px-3 text-sm text-slate-100 hover:border-slate-500">
      <LogIn className="mr-2" size={16} />
      Login
    </Link>
  );
}
