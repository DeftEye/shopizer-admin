"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { canAccessCatalogue } from "@/lib/auth/catalogue-guard";
import { getRoles } from "@/lib/auth/session";

export default function CatalogueProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => {
      if (!canAccessCatalogue(getRoles())) {
        router.replace("/pages/home");
        return;
      }
      setAllowed(true);
    }, 0);
    return () => window.clearTimeout(id);
  }, [router]);

  if (!allowed) {
    return null;
  }

  return children;
}
