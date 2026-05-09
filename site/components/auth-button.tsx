"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { LogIn, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function AuthButton() {
  const { data: session, status } = useSession();
  const router = useRouter();

  async function handleLogout() {
    await signOut({ redirect: false });
    router.push("/");
    router.refresh();
  }

  if (status === "loading") {
    return <span className="text-sm text-muted">...</span>;
  }

  if (session) {
    return (
      <button type="button" onClick={handleLogout} className="inline-flex min-h-10 items-center rounded-md border border-border bg-panelSoft px-3 text-sm text-slate-100 hover:border-slate-500">
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
