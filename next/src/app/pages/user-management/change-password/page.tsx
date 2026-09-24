"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useI18n } from "@/components/i18n-provider";
import formStyles from "@/components/user-form.module.css";
import { ApiError } from "@/lib/api/client";
import type { UserProfile } from "@/lib/api/types";
import { getUserProfile, updatePassword } from "@/lib/api/users";
import { getUserId } from "@/lib/auth/session";
import { isPasswordValid, passwordsMatch } from "@/lib/auth/user-form";

const SIDE_LINKS = [
  { id: "0", key: "COMPONENTS.MY_PROFILE", href: "/pages/user-management/profile" },
  {
    id: "1",
    key: "COMPONENTS.CHANGE_PASSWORD",
    href: "/pages/user-management/change-password",
  },
] as const;

export default function ChangePasswordPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [touched, setTouched] = useState({
    newPassword: false,
    confirmNewPassword: false,
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    getUserProfile().then(setUser).catch(() => undefined);
  }, []);

  const newPasswordError = !newPassword
    ? "required"
    : !isPasswordValid(newPassword)
      ? "invalid"
      : "";
  const confirmError =
    confirmNewPassword && !passwordsMatch(newPassword, confirmNewPassword)
      ? "notSame"
      : "";
  const valid =
    !!password && !newPasswordError && !!confirmNewPassword && !confirmError;

  async function onSave() {
    setTouched({ newPassword: true, confirmNewPassword: true });
    if (!valid) {
      return;
    }
    const userId = getUserId();
    if (!userId) {
      return;
    }
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      await updatePassword(userId, {
        password,
        changePassword: newPassword,
      });
      setSuccessMessage(t("USER.PASSWORD_CHANGED"));
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(t("USER.PASSWORD_NOT_MATCH"));
      } else {
        setErrorMessage(t("COMMON.INTERNAL_SERVER_ERROR"));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={formStyles.page}>
      <header className={formStyles.header}>
        <h1 className={formStyles.title}>
          {t("COMMON.PASSWORD")}
          {user?.userName ? ` - ${user.userName}` : ""}
        </h1>
        <select
          className={formStyles.nav}
          value="1"
          onChange={(event) => {
            const link = SIDE_LINKS.find((item) => item.id === event.target.value);
            if (link) {
              router.push(link.href);
            }
          }}
        >
          {SIDE_LINKS.map((item) => (
            <option key={item.id} value={item.id}>
              {t(item.key)}
            </option>
          ))}
        </select>
        <button
          type="button"
          className={`${formStyles.button} ${formStyles.cancel}`}
          onClick={() => router.push("/pages/user-management/profile")}
        >
          {t("COMMON.CANCEL")}
        </button>
        <button
          type="button"
          className={`${formStyles.button} ${formStyles.save}`}
          disabled={!valid || loading}
          onClick={() => void onSave()}
        >
          {loading ? "" : t("COMMON.SAVE")}
        </button>
      </header>

      <section className={formStyles.card}>
        {successMessage ? (
          <p className={`${formStyles.banner} ${formStyles.success}`}>{successMessage}</p>
        ) : null}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void onSave();
          }}
          noValidate
        >
          <div className={formStyles.field}>
            <label className={formStyles.label} htmlFor="password">
              {t("USER_CHANGE_PASSWORD.CURRENT_PASSWORD")}
            </label>
            <input
              id="password"
              type="password"
              className={formStyles.input}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={t("COMMON.PASSWORD")}
              autoComplete="current-password"
            />
            {errorMessage ? <span className={formStyles.err}>{errorMessage}</span> : null}
          </div>
          <div className={formStyles.field}>
            <label className={formStyles.label} htmlFor="newPassword">
              {t("USER_CHANGE_PASSWORD.NEW_PASSWORD")}
            </label>
            <input
              id="newPassword"
              type="password"
              className={formStyles.input}
              value={newPassword}
              onBlur={() => setTouched((current) => ({ ...current, newPassword: true }))}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder={t("USER_CHANGE_PASSWORD.NEW_PASSWORD")}
              autoComplete="new-password"
            />
            {touched.newPassword && newPasswordError === "required" ? (
              <span className={formStyles.err}>
                {t("USER_CHANGE_PASSWORD.PASSWORD_ERROR_REQUIRED")}
              </span>
            ) : null}
            {touched.newPassword && newPasswordError === "invalid" ? (
              <span className={formStyles.err}>
                {t("USER_CHANGE_PASSWORD.PASSWORD_ERROR_NOT_VALID")}
                <br />
                {t("USER_CHANGE_PASSWORD.PASSWORD_ERROR_RULES")}
              </span>
            ) : null}
          </div>
          <div className={formStyles.field}>
            <label className={formStyles.label} htmlFor="confirmNewPassword">
              {t("USER_CHANGE_PASSWORD.REPEAT_NEW_PASSWORD")}
            </label>
            <input
              id="confirmNewPassword"
              type="password"
              className={formStyles.input}
              value={confirmNewPassword}
              onBlur={() =>
                setTouched((current) => ({ ...current, confirmNewPassword: true }))
              }
              onChange={(event) => setConfirmNewPassword(event.target.value)}
              placeholder={t("USER_CHANGE_PASSWORD.REPEAT_NEW_PASSWORD")}
              autoComplete="new-password"
            />
            {touched.confirmNewPassword && confirmError ? (
              <span className={formStyles.err}>
                {t("USER_CHANGE_PASSWORD.PASSWORDS_NOT_MATCH")}
              </span>
            ) : null}
          </div>
        </form>
      </section>
    </div>
  );
}
