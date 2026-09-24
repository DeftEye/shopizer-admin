"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserProfile } from "@/lib/api";
import { clearSession, getToken, readMerchant, readRoles } from "@/lib/auth";
import type { AccessRoles, ShopizerUser } from "@/lib/types";

/**
 * Not a migrated Angular home screen. This is only proof that the login
 * handshake stored a Bearer token that `/v1/private/user/profile` accepts.
 */
export default function SessionPage() {
  const router = useRouter();
  const [user, setUser] = useState<ShopizerUser | null>(null);
  const [roles, setRoles] = useState<AccessRoles | null>(null);
  const [merchant, setMerchant] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    setRoles(readRoles());
    setMerchant(readMerchant());
    getUserProfile(token)
      .then(setUser)
      .catch((profileError: Error) => {
        setError(profileError.message);
      });
  }, [router]);

  function logout() {
    clearSession();
    router.replace("/login");
  }

  const activeRoles = Object.entries(roles ?? {})
    .filter(([, value]) => value)
    .map(([key]) => key);

  return (
    <main className="session-shell">
      <article className="session-card">
        <h1>Login handshake succeeded</h1>
        <p className="hint">
          This is not a port of Angular <code>#/pages/home</code>. It only
          confirms <code>POST /v1/private/login</code> and{" "}
          <code>GET /v1/private/user/profile</code> against the existing Spring
          Boot API.
        </p>
        {error ? (
          <p className="error" role="alert">
            {error}
          </p>
        ) : null}
        <dl>
          <dt>Username</dt>
          <dd>{user?.userName ?? "…"}</dd>
          <dt>Merchant</dt>
          <dd>{user?.merchant ?? merchant ?? "…"}</dd>
          <dt>Last access</dt>
          <dd>{user?.lastAccess ?? "—"}</dd>
        </dl>
        <div className="badge-row">
          {activeRoles.length === 0 ? (
            <span className="hint">No mapped groups yet</span>
          ) : (
            activeRoles.map((role) => (
              <span className="badge" key={role}>
                {role}
              </span>
            ))
          )}
        </div>
        <button className="primary-btn" type="button" onClick={logout}>
          Log out
        </button>
      </article>
    </main>
  );
}
