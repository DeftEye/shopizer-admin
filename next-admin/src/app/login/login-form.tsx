"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserProfile, login, ShopizerApiError } from "@/lib/api";
import {
  getToken,
  rememberUsername,
  rememberedUsername,
  saveSession,
} from "@/lib/auth";
import { rolesFromGroups, validateLogin } from "@/lib/roles";

/**
 * Angular source: `src/app/pages/auth/login/login.component.ts`
 * Route: `#/auth`
 * API: POST /v1/private/login then GET /v1/private/user/profile
 */
export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getToken()) {
      router.replace("/session");
      return;
    }
    const saved = rememberedUsername();
    setRemember(saved.remember);
    if (saved.username) {
      setUsername(saved.username);
    }
  }, [router]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validation = validateLogin(username, password);
    if (validation) {
      setError(validation);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const result = await login({
        username: username.trim(),
        password,
      });
      if (!result.token) {
        throw new ShopizerApiError(401, "Invalid username or password");
      }
      let user;
      try {
        user = await getUserProfile(result.token);
      } catch (profileError) {
        const message =
          profileError instanceof ShopizerApiError
            ? profileError.message
            : "Signed in, but the profile call failed";
        setError(message);
        saveSession({
          token: result.token,
          userId: result.id,
          roles: rolesFromGroups(undefined),
        });
        rememberUsername(username.trim(), remember);
        router.push("/session");
        return;
      }
      saveSession({
        token: result.token,
        userId: result.id ?? user.id,
        user,
        roles: rolesFromGroups(user.groups),
      });
      rememberUsername(username.trim(), remember);
      router.push("/session");
    } catch (submitError) {
      if (submitError instanceof ShopizerApiError) {
        setError(submitError.message);
      } else {
        setError("Cannot reach the Shopizer API");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="login-card" onSubmit={onSubmit} noValidate>
      <img
        className="login-logo"
        src="/shopizer-logo.png"
        alt="Shopizer"
        width={200}
        height={48}
      />
      {error ? (
        <p className="error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="field">
        <label htmlFor="username">Username</label>
        <input
          id="username"
          name="username"
          type="email"
          autoComplete="username"
          placeholder="Username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          required
        />
      </div>

      <div className="field">
        <label htmlFor="password">Password</label>
        <div className="password-row">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
      </div>

      <div className="row-between">
        <label>
          <input
            type="checkbox"
            checked={remember}
            onChange={(event) => setRemember(event.target.checked)}
          />
          Remember my user name
        </label>
        <span className="hint">Forgot password stays on Angular</span>
      </div>

      <button className="primary-btn" type="submit" disabled={loading}>
        {loading ? "Signing in…" : "Login"}
      </button>
      <p className="hint" style={{ marginTop: 20 }}>
        Next.js spike of Angular <code>#/auth</code>. Register and password
        reset are not ported. Point <code>SHOPIZER_API_URL</code> at the existing
        Spring Boot API.
      </p>
    </form>
  );
}
