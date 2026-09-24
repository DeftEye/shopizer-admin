"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearSession, getMerchant, getToken } from "@/lib/auth";

type AppShellProps = {
  children: React.ReactNode;
  requireAuth?: boolean;
};

export function AppShell({ children, requireAuth = true }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(!requireAuth);
  const [merchant, setMerchant] = useState("");

  useEffect(() => {
    if (!requireAuth) return;
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    setMerchant(getMerchant());
    setReady(true);
  }, [requireAuth, router]);

  function logout() {
    clearSession();
    router.replace("/login");
  }

  if (!ready) {
    return <div className="center">Checking session…</div>;
  }

  return (
    <div className="shell">
      <header className="shell-header">
        <div className="shell-brand">
          Shopizer Admin
          <span>Next.js spike — Angular remains source of truth</span>
        </div>
        <nav className="shell-nav">
          <Link
            href="/orders"
            aria-current={pathname === "/orders" ? "page" : undefined}
          >
            Orders
          </Link>
          <span className="shell-meta">{merchant ? `Store: ${merchant}` : ""}</span>
          <button type="button" className="btn btn-ghost" onClick={logout}>
            Log out
          </button>
        </nav>
      </header>
      <main className="shell-main">{children}</main>
    </div>
  );
}
