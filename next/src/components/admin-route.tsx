"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { canAccessUserAdmin } from "@/lib/auth/gate";
import { getRoles } from "@/lib/auth/session";

/** Client port of SuperuserAdmin / SuperuserAdminRetail guards. */
export function AdminRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (!canAccessUserAdmin(getRoles())) {
      router.replace("/pages/home");
      return;
    }
    const id = window.setTimeout(() => setAllowed(true), 0);
    return () => window.clearTimeout(id);
  }, [router]);

  if (!allowed) {
    return null;
  }

  return children;
}
