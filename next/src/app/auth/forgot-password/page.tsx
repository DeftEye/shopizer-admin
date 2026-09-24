"use client";

import Link from "next/link";
import { useState } from "react";

import { AuthCard } from "@/components/auth-card";
import card from "@/components/auth-card.module.css";
import { useI18n } from "@/components/i18n-provider";
import { client } from "@/lib/api/client";
import { isStrictEmail } from "@/lib/auth/login";

export default function ForgotPasswordPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const emailRequired = !email.trim() && !submitted;
  const emailInvalid = !!email.trim() && !isStrictEmail(email);
  const valid = isStrictEmail(email);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    setErrorMessage("");
    setSuccessMessage("");
    if (!valid) {
      return;
    }
    setLoading(true);
    const returnUrl = `${window.location.origin}/`;
    try {
      await client.post("/v1/user/password/reset/request", {
        username: email,
        returnUrl,
      });
      setEmail("");
      setSuccessMessage(t("FORGOT_PASSWORD.SENT_LINK"));
    } catch {
      setErrorMessage(t("FORGOT_PASSWORD.USER_NOT_FOUND"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard subtitle="Please provide your email id to reset password.">
      <form onSubmit={onSubmit} noValidate>
        {successMessage ? (
          <div className={`${card.banner} ${card.bannerSuccess}`}>{successMessage}</div>
        ) : null}
        {errorMessage ? (
          <div className={`${card.banner} ${card.bannerError}`}>{errorMessage}</div>
        ) : null}

        <div className={card.field}>
          <label className={card.label} htmlFor="email">
            {t("USER_FORM.EMAIL_ADDRESS")}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            className={card.input}
            placeholder="Please enter a email address"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setSubmitted(false);
            }}
          />
        </div>
        {emailRequired ? (
          <p className={card.error}>{t("USER_FORM.EMAIL_ADDRESS_ERROR_REQUIRED")}</p>
        ) : null}
        {emailInvalid ? (
          <p className={card.error}>{t("USER_FORM.EMAIL_ADDRESS_ERROR_NOT_VALID")}</p>
        ) : null}

        <div className={card.row}>
          <Link href="/auth" className={card.link}>
            Back to login
          </Link>
        </div>

        <button type="submit" className={card.button} disabled={!valid || loading}>
          {t("COMMON.SUBMIT")}
        </button>
      </form>
    </AuthCard>
  );
}
