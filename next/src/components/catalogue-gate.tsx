"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { canManageCatalogueItems } from "@/lib/auth/roles";
import { getRoles } from "@/lib/auth/session";

export function CatalogueGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!canManageCatalogueItems(getRoles())) {
      router.replace("/pages/home");
      return;
    }
    const id = window.setTimeout(() => setReady(true), 0);
    return () => window.clearTimeout(id);
  }, [router]);

  if (!ready) {
    return null;
  }

  return children;
}
