"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { login, getProfile, ApiError } from "@/lib/api";
import {
  clearSession,
  persistSession,
  rememberUsername,
  rememberedUsername,
} from "@/lib/auth";
import { rolesFromGroups } from "@/lib/roles";

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const remembered = rememberedUsername();
    setRemember(remembered.remember);
    setUsername(remembered.username);
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!username.trim() || !password) {
      setError("Username and password are required.");
      return;
    }

    setLoading(true);
    try {
      const session = await login(username.trim(), password);
      let profile;
      try {
        profile = await getProfile(session.token);
      } catch (err) {
        clearSession();
        const status = err instanceof ApiError ? err.status : 0;
        setError(
          status === 0
            ? "Cannot reach the Shopizer API. Is it running, and is SHOPIZER_API_URL correct?"
            : "Signed in, but the user profile could not be loaded.",
        );
        return;
      }
      persistSession({
        token: session.token,
        userId: session.id,
        merchant: profile.merchant,
        roles: rolesFromGroups(profile.groups),
        language: profile.defaultLanguage,
      });
      rememberUsername(username.trim(), remember);
      router.replace("/orders");
    } catch (err) {
      clearSession();
      const status = err instanceof ApiError ? err.status : 0;
      setError(
        status === 0
          ? "Cannot reach the Shopizer API. Is it running, and is SHOPIZER_API_URL correct?"
          : "Invalid username or password.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="panel login-card" onSubmit={onSubmit}>
      <h1 className="page-title">Sign in</h1>
      <p className="muted">
        Same contract as Angular <code>#/auth</code>:{" "}
        <code>POST /v1/private/login</code>
      </p>
      {error ? <p className="error">{error}</p> : null}
      <div className="field">
        <label htmlFor="username">Username</label>
        <input
          id="username"
          name="username"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div className="row">
        <label>
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />{" "}
          Remember username
        </label>
      </div>
      <button className="btn" type="submit" disabled={loading}>
        {loading ? "Signing in…" : "Login"}
      </button>
    </form>
  );
}
