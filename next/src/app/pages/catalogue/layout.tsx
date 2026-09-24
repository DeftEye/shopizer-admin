"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { canAccessCatalogue } from "@/lib/catalogue/access";
import { getRoles } from "@/lib/auth/session";

export default function CatalogueLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (!canAccessCatalogue(getRoles())) {
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
