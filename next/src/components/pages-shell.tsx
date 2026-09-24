"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { pingHealth } from "@/lib/auth/health";
import { clearTokenCookie, getToken } from "@/lib/auth/session";

import { Footer } from "./footer";
import { Header } from "./header";
import styles from "./pages-shell.module.css";
import { SidebarMenu } from "./sidebar-menu";

export function PagesShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      clearTokenCookie();
      router.replace("/auth");
      return;
    }
    setReady(true);
  }, [router]);

  useEffect(() => {
    if (!ready) {
      return;
    }
    let cancelled = false;
    const check = async () => {
      const up = await pingHealth();
      if (!cancelled && !up) {
        router.push("/error-page");
      }
    };
    void check();
    const id = window.setInterval(check, 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [ready, router]);

  if (!ready) {
    return null;
  }

  return (
    <div className={`${styles.shell} ${sidebarOpen ? "" : styles.collapsed}`}>
      <div className={styles.header}>
        <Header onToggleSidebar={() => setSidebarOpen((v) => !v)} />
      </div>
      <aside className={styles.sidebar}>
        <SidebarMenu />
      </aside>
      <main className={styles.main}>{children}</main>
      <div className={styles.footer}>
        <Footer />
      </div>
    </div>
  );
}
