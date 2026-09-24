"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { useI18n } from "@/components/i18n-provider";
import { ApiError } from "@/lib/api/client";
import type { StoreName, UserProfile, UserWritePayload } from "@/lib/api/types";
import {
  checkIfUserExist,
  createUser,
  deleteUser,
  getAdminGroups,
  getMerchantStoreNames,
  updateUser,
} from "@/lib/api/users";
import { getMerchant, getRoles, getUserId } from "@/lib/auth/session";
import {
  applyUserGroups,
  canEditUser,
  initAdminGroups,
  isSelfUser,
  isStoreFieldEnabled,
  passwordRequired,
  resolveSaveStore,
  selectedGroups,
  showPasswordFields,
  storeRequiredOnSave,
  type GroupOption,
  userFormValid,
  validateUserForm,
} from "@/lib/auth/user-form";
import { readEnv } from "@/lib/env";

import styles from "./user-form.module.css";

const SIDE_LINKS = [
  { id: "0", key: "COMPONENTS.MY_PROFILE", href: "/pages/user-management/profile" },
  {
    id: "1",
    key: "COMPONENTS.CHANGE_PASSWORD",
    href: "/pages/user-management/change-password",
  },
] as const;

type FormState = {
  firstName: string;
  lastName: string;
  store: string;
  emailAddress: string;
  password: string;
  repeatPassword: string;
  active: boolean;
  defaultLanguage: string;
};

const emptyForm: FormState = {
  firstName: "",
  lastName: "",
  store: "",
  emailAddress: "",
  password: "",
  repeatPassword: "",
  active: false,
  defaultLanguage: "",
};

export function UserForm({
  user,
  title,
}: {
  user?: UserProfile | null;
  title: string;
}) {
  const { t, langs } = useI18n();
  const router = useRouter();
  const flags = useMemo(() => getRoles(), []);
  const currentUserId = getUserId();
  const sessionStore = getMerchant() ?? "";
  const selfEdit = isSelfUser(user, currentUserId);
  const mode = user?.id ? "edit" : "create";
  const canEdit = canEditUser(user, flags);
  const showPassword = showPasswordFields(user, flags, selfEdit);
  const requirePassword = passwordRequired(user);
  const storeEnabled = isStoreFieldEnabled(flags, mode, selfEdit);
  const languages = langs.length ? langs : readEnv().langs;

  const [form, setForm] = useState<FormState>(emptyForm);
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [stores, setStores] = useState<StoreName[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [emailUnique, setEmailUnique] = useState(true);
  const [banner, setBanner] = useState<{ kind: "success" | "error"; text: string } | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;
    const merchant = getMerchant() ?? "";
    Promise.all([getAdminGroups(), getMerchantStoreNames(merchant)])
      .then(([allGroups, storeNames]) => {
        if (cancelled) {
          return;
        }
        let next = initAdminGroups(allGroups, flags);
        if (user) {
          next = applyUserGroups(next, user, flags, isSelfUser(user, getUserId()));
          setForm({
            firstName: user.firstName,
            lastName: user.lastName,
            store: user.merchant,
            emailAddress: user.emailAddress,
            password: "",
            repeatPassword: "",
            active: user.active,
            defaultLanguage: user.defaultLanguage,
          });
        } else {
          setForm((current) => ({ ...current, store: merchant }));
        }
        setGroups(next);
        setStores(storeNames);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [flags, user]);

  const errors = validateUserForm({
    ...form,
    groups,
    requirePassword,
    showPassword,
  });
  const valid = userFormValid(errors) && emailUnique && canEdit && !saving;

  function patch<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function mark(field: string) {
    setTouched((current) => ({ ...current, [field]: true }));
  }

  async function onEmailBlur() {
    mark("emailAddress");
    const email = form.emailAddress.trim();
    const merchant = form.store || user?.merchant || sessionStore;
    if (!email) {
      setEmailUnique(true);
      return;
    }
    try {
      const res = await checkIfUserExist({ unique: email, merchant });
      if (user && user.emailAddress === email) {
        setEmailUnique(true);
      } else {
        setEmailUnique(!res.exists);
      }
    } catch {
      setEmailUnique(true);
    }
  }

  async function onSave() {
    setSaving(true);
    setBanner(null);
    Object.keys({ ...form, groups: true }).forEach((field) => mark(field));

    if (storeRequiredOnSave(flags, form.store)) {
      setBanner({ kind: "error", text: t("USER_FORM.STORE_REQUIRED") });
      setSaving(false);
      return;
    }
    if (!emailUnique) {
      setBanner({ kind: "error", text: t("USER_FORM.EMAIL_EXISTS") });
      setSaving(false);
      return;
    }
    const nextGroups = selectedGroups(groups);
    if (nextGroups.length === 0) {
      setBanner({ kind: "error", text: t("COMMON.ADDING_USER_GROUPS_ERROR") });
      setSaving(false);
      return;
    }
    if (!userFormValid(errors) || !canEdit) {
      setSaving(false);
      return;
    }

    const store = resolveSaveStore({
      formStore: form.store,
      sessionStore,
      user,
    });
    const payload: UserWritePayload = {
      firstName: form.firstName,
      lastName: form.lastName,
      store,
      userName: form.emailAddress,
      emailAddress: form.emailAddress,
      password: form.password,
      repeatPassword: form.repeatPassword,
      active: form.active,
      defaultLanguage: form.defaultLanguage,
      groups: nextGroups,
    };

    try {
      if (user?.id) {
        await updateUser(user.id, payload, store);
        setBanner({ kind: "success", text: t("USER_FORM.USER_UPDATED") });
      } else {
        await createUser(payload, store);
        setBanner({ kind: "success", text: t("USER_FORM.USER_CREATED") });
        router.push("/pages/user-management/users");
      }
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : t("COMMON.INTERNAL_SERVER_ERROR");
      setBanner({ kind: "error", text: message });
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (selfEdit || userHasSuper(user)) {
      setBanner({ kind: "error", text: t("USER.CANNOT_REMOVE_SELF") });
      return;
    }
    if (!user?.id) {
      return;
    }
    try {
      await deleteUser(user.id, getMerchant() ?? user.merchant);
      setBanner({ kind: "success", text: t("USER_FORM.USER_REMOVED") });
      router.push("/pages/user-management/users");
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : t("COMMON.INTERNAL_SERVER_ERROR");
      setBanner({ kind: "error", text: message });
    }
  }

  function toggleGroup(name: string) {
    setGroups((current) =>
      current.map((group) =>
        group.name === name && !group.disabled
          ? { ...group, checked: !group.checked }
          : group,
      ),
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t(title)}</h1>
        {selfEdit ? (
          <select
            className={styles.nav}
            value="0"
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
        ) : null}
        {title === "COMPONENTS.USER_DETAILS" ? (
          <button
            type="button"
            className={`${styles.button} ${styles.cancel}`}
            onClick={() => router.push("/pages/user-management/users")}
          >
            {t("COMMON.CANCEL")}
          </button>
        ) : null}
        <button
          type="button"
          className={`${styles.button} ${styles.remove}`}
          disabled={selfEdit || !canEdit || !user?.id}
          onClick={() => void onDelete()}
        >
          {t("COMMON.REMOVE")}
        </button>
        <button
          type="button"
          className={`${styles.button} ${styles.save}`}
          disabled={!valid}
          onClick={() => void onSave()}
        >
          {saving ? "" : t("COMMON.SAVE")}
        </button>
      </header>

      <section className={styles.card}>
        {banner ? (
          <p className={`${styles.banner} ${banner.kind === "success" ? styles.success : styles.error}`}>
            {banner.text}
          </p>
        ) : null}
        {loading ? <p className={styles.loading}>…</p> : null}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void onSave();
          }}
          noValidate
        >
          <div className={styles.field}>
            <label className={styles.label} htmlFor="firstName">
              {t("USER_FORM.FIRST_NAME")} *
            </label>
            <input
              id="firstName"
              className={styles.input}
              value={form.firstName}
              disabled={!canEdit}
              onBlur={() => mark("firstName")}
              onChange={(event) => patch("firstName", event.target.value)}
              placeholder={t("USER_FORM.FIRST_NAME")}
            />
            {touched.firstName && errors.firstName ? (
              <span className={styles.err}>{t("USER_FORM.FIRST_NAME_ERROR_REQUIRED")}</span>
            ) : null}
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="lastName">
              {t("USER_FORM.LAST_NAME")} *
            </label>
            <input
              id="lastName"
              className={styles.input}
              value={form.lastName}
              disabled={!canEdit}
              onBlur={() => mark("lastName")}
              onChange={(event) => patch("lastName", event.target.value)}
              placeholder={t("USER_FORM.LAST_NAME")}
            />
            {touched.lastName && errors.lastName ? (
              <span className={styles.err}>{t("USER_FORM.LAST_NAME_ERROR_REQUIRED")}</span>
            ) : null}
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="store">
              {t("STORE.MERCHANT_STORE")} *
            </label>
            <select
              id="store"
              className={styles.select}
              value={form.store}
              disabled={!storeEnabled}
              onChange={(event) => patch("store", event.target.value)}
            >
              {stores.length === 0 ? (
                <option value={form.store}>{form.store || sessionStore}</option>
              ) : null}
              {stores.map((store) => (
                <option key={store.code} value={store.code}>
                  {store.code}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="emailAddress">
              {t("USER_FORM.EMAIL_ADDRESS")} *
            </label>
            <input
              id="emailAddress"
              type="email"
              className={styles.input}
              value={form.emailAddress}
              disabled={!canEdit}
              onBlur={() => void onEmailBlur()}
              onChange={(event) => {
                patch("emailAddress", event.target.value);
                setEmailUnique(true);
              }}
              placeholder={t("USER_FORM.EMAIL_ADDRESS")}
            />
            {touched.emailAddress && errors.emailAddress === "invalid" ? (
              <span className={styles.err}>{t("USER_FORM.EMAIL_ADDRESS_ERROR_REQUIRED")}</span>
            ) : null}
            {touched.emailAddress && errors.emailAddress === "required" ? (
              <span className={styles.err}>{t("USER_FORM.EMAIL_ADDRESS_ERROR_NOT_VALID")}</span>
            ) : null}
            {!emailUnique ? (
              <span className={styles.err}>{t("USER_FORM.EMAIL_EXISTS")}</span>
            ) : null}
          </div>

          {showPassword ? (
            <>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="password">
                  {t("COMMON.PASSWORD")} *
                </label>
                <input
                  id="password"
                  type="password"
                  className={styles.input}
                  value={form.password}
                  disabled={!canEdit}
                  onBlur={() => mark("password")}
                  onChange={(event) => patch("password", event.target.value)}
                  placeholder={t("COMMON.PASSWORD")}
                  autoComplete="new-password"
                />
                {touched.password && errors.password === "required" ? (
                  <span className={styles.err}>{t("USER_FORM.PASSWORD_ERROR_REQUIRED")}</span>
                ) : null}
                {touched.password && errors.password === "invalid" ? (
                  <span className={styles.err}>
                    {t("USER_FORM.PASSWORD_ERROR_NOT_VALID")}
                    <br />
                    {t("USER_FORM.PASSWORD_ERROR_RULES")}
                  </span>
                ) : null}
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="repeatPassword">
                  Repeat Password *
                </label>
                <input
                  id="repeatPassword"
                  type="password"
                  className={styles.input}
                  value={form.repeatPassword}
                  disabled={!canEdit}
                  onBlur={() => mark("repeatPassword")}
                  onChange={(event) => patch("repeatPassword", event.target.value)}
                  placeholder="Repeat Password"
                  autoComplete="new-password"
                />
                {touched.repeatPassword && errors.repeatPassword === "required" ? (
                  <span className={styles.err}>{t("USER_FORM.PASSWORD_ERROR_REQUIRED")}</span>
                ) : null}
                {errors.repeatPassword === "notSame" ? (
                  <span className={styles.err}>
                    {t("USER_CHANGE_PASSWORD.PASSWORDS_NOT_MATCH")}
                  </span>
                ) : null}
              </div>
            </>
          ) : null}

          <div className={styles.field}>
            <label className={styles.check}>
              <input
                type="checkbox"
                checked={form.active}
                disabled={!canEdit}
                onChange={(event) => patch("active", event.target.checked)}
              />
              {t("USER_FORM.ACTIVE")}
            </label>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="defaultLanguage">
              {t("COMMON.DEFAULT_LANGUAGE")} *
            </label>
            <select
              id="defaultLanguage"
              className={styles.select}
              value={form.defaultLanguage}
              disabled={!canEdit}
              onBlur={() => mark("defaultLanguage")}
              onChange={(event) => patch("defaultLanguage", event.target.value)}
            >
              <option value="">{t("COMMON.SELECT_LANGUAGE")}</option>
              {languages.map((code) => (
                <option key={code} value={code}>
                  {t(`LANG.${code}`)}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <span className={styles.label}>{t("USER_FORM.GROUPS")} *</span>
            <div className={styles.groups}>
              {groups.map((group) => (
                <label key={group.id ?? group.name} className={styles.check}>
                  <input
                    type="checkbox"
                    checked={group.checked}
                    disabled={group.disabled || !canEdit}
                    onChange={() => toggleGroup(group.name)}
                  />
                  {group.name}
                </label>
              ))}
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}

function userHasSuper(user?: UserProfile | null): boolean {
  return !!user?.groups?.some((group) => group.name === "SUPERADMIN");
}
