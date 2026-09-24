"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";

/** `/` follows Angular `#/` → pages (if token) else `#/auth`. */
export default function IndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(getToken() ? "/session" : "/login");
  }, [router]);

  return <p className="session-shell hint">Opening the login spike…</p>;
}
