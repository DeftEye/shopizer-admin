"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AuthCard } from "@/components/auth-card";
import card from "@/components/auth-card.module.css";
import { useI18n } from "@/components/i18n-provider";
import { isEmail, loginErrorMessage, loginWithCredentials } from "@/lib/auth/login";
import { getRememberedEmail, isRememberEnabled, setRemember } from "@/lib/auth/session";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [username, setUsername] = useState(() => getRememberedEmail());
  const [password, setPassword] = useState("");
  const [remember, setRememberChecked] = useState(() => isRememberEnabled());
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPass, setShowPass] = useState(false);

  const usernameError =
    submitted && !username.trim()
      ? t("LOGIN.INVALID_EMPTY_USERNAME")
      : submitted && !isEmail(username)
        ? t("LOGIN.INVALID_FORMAT_USERNAME")
        : "";
  const passwordError =
    submitted && !password ? t("LOGIN.INVALID_EMPTY_PASSWORD") : "";

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    setLoading(true);
    if (!username.trim() || !isEmail(username) || !password) {
      setLoading(false);
      return;
    }
    setErrorMessage("");
    try {
      await loginWithCredentials(username, password, remember);
      router.push("/pages/home");
    } catch (error) {
      setErrorMessage(loginErrorMessage(error, t));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard>
      <form onSubmit={onSubmit} noValidate>
        {errorMessage ? (
          <div className={`${card.banner} ${card.bannerError}`} role="alert">
            {errorMessage}
          </div>
        ) : null}

        <div className={card.field}>
          <label className={card.label} htmlFor="username">
            {t("LOGIN.USERNAME")}
          </label>
          <input
            id="username"
            name="username"
            className={card.input}
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />
        </div>
        {usernameError ? <p className={card.error}>{usernameError}</p> : null}

        <div className={card.field}>
          <label className={card.label} htmlFor="password">
            {t("LOGIN.PASSWORD")}
          </label>
          <div className={card.passwordWrap}>
            <input
              id="password"
              name="password"
              className={card.input}
              type={showPass ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <button
              type="button"
              className={card.toggle}
              onClick={() => setShowPass((v) => !v)}
              aria-label={showPass ? "Hide password" : "Show password"}
            >
              {showPass ? "Hide" : "Show"}
            </button>
          </div>
        </div>
        {passwordError ? <p className={card.error}>{passwordError}</p> : null}

        <div className={card.row}>
          <label className={card.remember}>
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => {
                setRememberChecked(e.target.checked);
                setRemember(e.target.checked, username);
              }}
            />
            {t("LOGIN.REMEMBER_USERNAME")}
          </label>
          <Link href="/auth/forgot-password" className={card.link}>
            {t("LOGIN.FORGOT_PASSWORD")}
          </Link>
        </div>

        <button type="submit" className={card.button} disabled={loading}>
          {t("COMMON.LOGIN")}
        </button>

        <p className={card.footer}>
          Don&apos;t have an account?{" "}
          <Link href="/auth/register" className={card.link}>
            Register
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
