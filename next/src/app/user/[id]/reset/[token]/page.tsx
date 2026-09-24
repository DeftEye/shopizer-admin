"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AuthCard } from "@/components/auth-card";
import card from "@/components/auth-card.module.css";
import { useI18n } from "@/components/i18n-provider";
import { client } from "@/lib/api/client";
import { PASSWORD_PATTERN } from "@/lib/constants";

export default function ResetPasswordPage() {
  const params = useParams<{ id: string; token: string }>();
  const token = params.token;
  const router = useRouter();
  const { t } = useI18n();
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showRepeat, setShowRepeat] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isValid, setIsValid] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    client
      .get(`/v1/user/DEFAULT/reset/${token}`)
      .then(() => {
        if (!cancelled) {
          setIsValid(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIsValid(false);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const passwordOk = PASSWORD_PATTERN.test(password);
  const match = password === repeatPassword && !!repeatPassword;
  const formValid = passwordOk && match;

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!formValid) {
      return;
    }
    setLoading(true);
    setErrorMessage("");
    try {
      await client.post(`/v1/user/DEFAULT/password/${token}`, {
        password,
        repeatPassword,
      });
      setPassword("");
      setRepeatPassword("");
      setSuccessMessage(t("FORGOT_PASSWORD.SUCCESS"));
      setTimeout(() => router.push("/auth"), 2000);
    } catch {
      setErrorMessage(t("FORGOT_PASSWORD.FAIL"));
    } finally {
      setLoading(false);
    }
  }

  if (!isValid) {
    return (
      <AuthCard>
        <div>
          <h1>400</h1>
          <h2>Your reset password link is invalid.</h2>
          <p>
            To reset your password, return to the login page and select &apos;Forgot
            Password&apos; to send a new email
          </p>
          <Link href="/auth" className={card.link}>
            Back to login page
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard subtitle="Reset your administration password.">
      <form onSubmit={onSubmit} noValidate>
        {successMessage ? (
          <div className={`${card.banner} ${card.bannerSuccess}`}>{successMessage}</div>
        ) : null}
        {errorMessage ? (
          <div className={`${card.banner} ${card.bannerError}`}>{errorMessage}</div>
        ) : null}

        <div className={card.field}>
          <label className={card.label} htmlFor="password">
            {t("USER_CHANGE_PASSWORD.NEW_PASSWORD")}
          </label>
          <div className={card.passwordWrap}>
            <input
              id="password"
              name="password"
              type={showPass ? "text" : "password"}
              className={card.input}
              placeholder={t("USER_CHANGE_PASSWORD.NEW_PASSWORD")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className={card.toggle}
              onClick={() => setShowPass((v) => !v)}
            >
              {showPass ? "Hide" : "Show"}
            </button>
          </div>
        </div>
        {!password ? (
          <p className={card.error}>{t("USER_CHANGE_PASSWORD.PASSWORD_ERROR_REQUIRED")}</p>
        ) : null}
        {password && !passwordOk ? (
          <p className={card.error}>{t("USER_CHANGE_PASSWORD.PASSWORD_ERROR_RULES")}</p>
        ) : null}

        <div className={card.field}>
          <label className={card.label} htmlFor="repeatPassword">
            {t("USER_CHANGE_PASSWORD.REPEAT_NEW_PASSWORD")}
          </label>
          <div className={card.passwordWrap}>
            <input
              id="repeatPassword"
              name="repeatPassword"
              type={showRepeat ? "text" : "password"}
              className={card.input}
              placeholder={t("USER_CHANGE_PASSWORD.REPEAT_NEW_PASSWORD")}
              value={repeatPassword}
              onChange={(e) => setRepeatPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className={card.toggle}
              onClick={() => setShowRepeat((v) => !v)}
            >
              {showRepeat ? "Hide" : "Show"}
            </button>
          </div>
        </div>
        {repeatPassword && !match ? (
          <p className={card.error}>{t("USER_CHANGE_PASSWORD.PASSWORDS_NOT_MATCH")}</p>
        ) : null}

        <button type="submit" className={card.button} disabled={!formValid || loading}>
          {t("COMMON.SUBMIT")}
        </button>
      </form>
    </AuthCard>
  );
}
