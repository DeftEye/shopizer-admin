"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { getToken, syncTokenCookie } from "@/lib/auth/session";

export default function Page() {
  const router = useRouter();

  useEffect(() => {
    if (getToken()) {
      syncTokenCookie();
      router.replace("/pages/home");
    } else {
      router.replace("/auth");
    }
  }, [router]);

  return null;
}
