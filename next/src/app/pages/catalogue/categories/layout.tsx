"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { canEnterCategoryRoutes } from "@/lib/catalogue/access";
import { getRoles } from "@/lib/auth/session";
import { readEnv } from "@/lib/env";

export default function CategoriesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (!canEnterCategoryRoutes(getRoles(), readEnv().mode)) {
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
