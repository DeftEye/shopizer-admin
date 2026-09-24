"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useI18n } from "@/components/i18n-provider";
import { RoleGate } from "@/components/role-gate";
import {
  createPageContent,
  getPageContent,
  getStore,
  updatePageContent,
} from "@/lib/api/store";
import type { LandingDescription, LandingPage, StoreDetails } from "@/lib/api/types";
import { canAccessStoreDetails } from "@/lib/auth/gate";
import { getMerchant } from "@/lib/auth/session";

import styles from "@/components/store-page.module.css";

export default function StoreLandingPage() {
  return (
    <RoleGate allow={canAccessStoreDetails}>
      <StoreLanding />
    </RoleGate>
  );
}

function emptyDescriptions(languages: string[]): LandingDescription[] {
  return languages.map((language) => ({
    language,
    name: "",
    metaDescription: "",
    id: "",
    keyWords: "",
    description: "",
  }));
}

function StoreLanding() {
  const { t } = useI18n();
  const router = useRouter();
  const params = useParams<{ code: string }>();
  const [store, setStore] = useState<StoreDetails | null>(null);
  const [page, setPage] = useState<LandingPage | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [descriptions, setDescriptions] = useState<LandingDescription[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!params.code) {
      return;
    }
    Promise.all([getPageContent("LANDING_PAGE", params.code), getStore(params.code)]).then(
      ([content, merchantStore]) => {
        setStore(merchantStore);
        const languages = (merchantStore.supportedLanguages ?? []).map((lang) => lang.code);
        const next = emptyDescriptions(languages);
        if (content) {
          setPage(content);
          for (const description of content.descriptions ?? []) {
            const index = next.findIndex((item) => item.language === description.language);
            if (index !== -1) {
              next[index] = {
                ...next[index],
                ...description,
              };
            }
          }
        }
        setDescriptions(next);
      },
    );
  }, [params.code]);

  function route(link: string) {
    if (!store?.code) {
      return;
    }
    router.push(`/pages/store-management/${link}/${store.code}`);
  }

  function patchDescription(index: number, field: keyof LandingDescription, value: string) {
    setDescriptions((current) =>
      current.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  }

  async function save() {
    if (!store) {
      return;
    }
    setSaving(true);
    setError("");
    setMessage("");
    const payload = {
      selectedLanguage,
      code: "LANDING_PAGE",
      id: page?.id ?? "",
      name: getMerchant() ?? "",
      descriptions,
    };
    try {
      if (page?.id) {
        await updatePageContent(page.id, payload);
        setMessage(t("STORE_LANDING.PAGE_UPDATED"));
      } else {
        await createPageContent(payload, store.code);
        setMessage(t("STORE_LANDING.PAGE_ADDED"));
        router.push(`/pages/store-management/store/${store.code}`);
      }
    } catch {
      setError(t("COMMON.INTERNAL_SERVER_ERROR"));
    } finally {
      setSaving(false);
    }
  }

  const languages = store?.supportedLanguages ?? [];
  const activeIndex = descriptions.findIndex((item) => item.language === selectedLanguage);
  const active = activeIndex >= 0 ? descriptions[activeIndex] : null;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t("STORE.STORE_INFORMATION")}</h1>
        <div className={styles.actions}>
          <select
            className={styles.select}
            value="store-landing"
            onChange={(event) => route(event.target.value)}
            aria-label={t("COMPONENTS.STORE_LANDING")}
          >
            <option value="store-branding">{t("COMPONENTS.STORE_BRANDING")}</option>
            <option value="store-landing">{t("COMPONENTS.STORE_LANDING")}</option>
            <option value="store">{t("COMPONENTS.STORE_DETAILS")}</option>
          </select>
          <select
            className={styles.select}
            value={selectedLanguage}
            onChange={(event) => setSelectedLanguage(event.target.value)}
            aria-label={t("COMMON.LANGUAGE")}
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {t(`LANG.${lang.code}`)}
              </option>
            ))}
          </select>
          <button
            type="button"
            className={styles.primary}
            disabled={saving}
            onClick={() => void save()}
          >
            {saving ? "" : t("COMMON.SAVE")}
          </button>
        </div>
      </header>
      {message ? <p className={`${styles.banner} ${styles.bannerSuccess}`}>{message}</p> : null}
      {error ? <p className={`${styles.banner} ${styles.bannerError}`}>{error}</p> : null}
      {active && activeIndex >= 0 ? (
        <form className={styles.card} noValidate>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="landing-title">
              {t("STORE_LANDING.LANDING_PAGE_TITLE")} *
            </label>
            <input
              id="landing-title"
              className={styles.input}
              value={active.name}
              onChange={(event) => patchDescription(activeIndex, "name", event.target.value)}
              required
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="landing-meta">
              {t("STORE_LANDING.TAG_DESCRIPTION")}
            </label>
            <input
              id="landing-meta"
              className={styles.input}
              value={active.metaDescription ?? ""}
              onChange={(event) =>
                patchDescription(activeIndex, "metaDescription", event.target.value)
              }
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="landing-text">
              {t("STORE_LANDING.LANDING_TEXT")}
            </label>
            <textarea
              id="landing-text"
              className={styles.textarea}
              value={active.description ?? ""}
              onChange={(event) =>
                patchDescription(activeIndex, "description", event.target.value)
              }
            />
          </div>
        </form>
      ) : null}
    </div>
  );
}
