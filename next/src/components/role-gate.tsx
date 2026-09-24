"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import type { RoleFlags } from "@/lib/api/types";
import { getRoles } from "@/lib/auth/session";

export function RoleGate({
  allow,
  children,
}: {
  allow: (flags: RoleFlags) => boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!allow(getRoles())) {
      router.replace("/pages/home");
      return;
    }
    const id = window.setTimeout(() => setReady(true), 0);
    return () => window.clearTimeout(id);
  }, [allow, router]);

  if (!ready) {
    return null;
  }

  return <>{children}</>;
}
