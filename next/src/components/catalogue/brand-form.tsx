"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { CatalogueGate } from "@/components/catalogue-gate";
import { useI18n } from "@/components/i18n-provider";
import {
  checkBrandCode,
  createBrand,
  emptyBrandDescription,
  fillEmptyBrandDescriptions,
  getBrandById,
  updateBrand,
} from "@/lib/api/brands";
import { getStoreLanguages } from "@/lib/api/catalog";
import type { Brand, BrandDescription } from "@/lib/api/types";
import { getLang, getMerchant } from "@/lib/auth/session";
import { ALPHANUMERIC_PATTERN, NUMBER_PATTERN } from "@/lib/constants";
import { slugify } from "@/lib/format";

import styles from "../catalog.module.css";

export function BrandForm({
  brandId,
  titleKey,
}: {
  brandId?: string;
  titleKey: string;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [languages, setLanguages] = useState<string[]>([]);
  const [code, setCode] = useState("");
  const [order, setOrder] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState(getLang());
  const [descriptions, setDescriptions] = useState<BrandDescription[]>([]);
  const [brand, setBrand] = useState<Brand>({ code: "" });
  const [touched, setTouched] = useState({ code: false, name: false, url: false });
  const [isCodeUnique, setIsCodeUnique] = useState(true);
  const [loader, setLoader] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const codeCheckSeq = useRef(0);
  const saveInFlight = useRef(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoader(true);
      try {
        const langs = await getStoreLanguages(getMerchant() ?? "");
        const codes = langs.map((lang) => lang.code);
        let nextBrand: Brand = { code: "" };
        if (brandId) {
          nextBrand = await getBrandById(brandId);
        }
        if (cancelled) {
          return;
        }
        setLanguages(codes);
        setBrand(nextBrand);
        setCode(nextBrand.code ?? "");
        setOrder(nextBrand.order == null ? "" : String(nextBrand.order));
        setSelectedLanguage(getLang());
        setDescriptions(
          codes.map((language) => {
            const existing = nextBrand.descriptions?.find(
              (item) => item.language === language,
            );
            return existing
              ? { ...emptyBrandDescription(language), ...existing }
              : emptyBrandDescription(language);
          }),
        );
      } catch {
        if (!cancelled) {
          setError(t("COMMON.INTERNAL_SERVER_ERROR"));
        }
      } finally {
        if (!cancelled) {
          setLoader(false);
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [brandId, t]);

  const currentIndex = useMemo(
    () => descriptions.findIndex((item) => item.language === selectedLanguage),
    [descriptions, selectedLanguage],
  );
  const current = currentIndex >= 0 ? descriptions[currentIndex] : null;

  function patchDescription(index: number, patch: Partial<BrandDescription>) {
    setDescriptions((currentDescriptions) =>
      currentDescriptions.map((item, i) =>
        i === index ? { ...item, ...patch } : item,
      ),
    );
  }

  function onNameChange(index: number, name: string) {
    patchDescription(index, { name, friendlyUrl: slugify(name) });
  }

  function onCodeInput(next: string) {
    setCode(next);
    if (!next) {
      codeCheckSeq.current += 1;
      setIsCodeUnique(true);
    }
  }

  async function checkUniqueCode(next: string) {
    const seq = ++codeCheckSeq.current;
    if (!next) {
      setIsCodeUnique(true);
      return;
    }
    try {
      const res = await checkBrandCode(next);
      if (seq !== codeCheckSeq.current) {
        return;
      }
      setIsCodeUnique(!(res.exists && brand.code !== next));
    } catch {
      if (seq !== codeCheckSeq.current) {
        return;
      }
      setIsCodeUnique(true);
    }
  }

  async function save() {
    if (saveInFlight.current) {
      return;
    }
    setTouched({ code: true, name: true, url: true });
    setError("");
    setMessage("");
    const filled = fillEmptyBrandDescriptions(descriptions);
    if (!filled || !code) {
      setError(t("COMMON.FILL_REQUIRED_FIELDS"));
      return;
    }
    if (!ALPHANUMERIC_PATTERN.test(code) || !NUMBER_PATTERN.test(order)) {
      setError(t("COMMON.FILL_REQUIRED_FIELDS"));
      return;
    }
    saveInFlight.current = true;
    setSaving(true);
    const body = {
      code,
      order,
      selectedLanguage,
      descriptions: filled,
    };
    try {
      const res = await checkBrandCode(code);
      const unique = !(res.exists && brand.code !== code);
      setIsCodeUnique(unique);
      if (!unique) {
        setError(t("COMMON.CODE_EXISTS"));
        return;
      }
      if (brand.id) {
        await updateBrand(brand.id, body);
        setMessage(t("BRAND.BRAND_UPDATED"));
      } else {
        await createBrand(body);
        setMessage(t("BRAND.BRAND_CREATED"));
        router.push("/pages/catalogue/brands/brands-list");
      }
    } catch {
      setError(t("COMMON.INTERNAL_SERVER_ERROR"));
    } finally {
      saveInFlight.current = false;
      setSaving(false);
    }
  }

  return (
    <CatalogueGate>
      <div className={styles.page}>
        <header className={styles.header}>
          <h1 className={styles.title}>{t(titleKey)}</h1>
          <button
            type="button"
            className={styles.secondary}
            onClick={() => router.push("/pages/catalogue/brands/brands-list")}
          >
            {t("ORDER_FORM.CANCLE")}
          </button>
          <button
            type="button"
            className={styles.primary}
            onClick={() => void save()}
            disabled={saving || loader}
          >
            {saving ? "" : t("COMMON.SAVE")}
          </button>
        </header>
        <section className={styles.card}>
          {error ? (
            <p className={`${styles.banner} ${styles.bannerError}`} role="alert">
              {error}
            </p>
          ) : null}
          {message ? (
            <p className={`${styles.banner} ${styles.bannerSuccess}`}>{message}</p>
          ) : null}
          {loader ? <p className={styles.empty}>…</p> : null}
          {!loader ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void save();
              }}
            >
              <div className={styles.field}>
                <label className={styles.label} htmlFor="brand-code">
                  {t("COMMON.CODE")}
                </label>
                <input
                  id="brand-code"
                  className={styles.input}
                  value={code}
                  readOnly={!!brand.id}
                  required
                  onChange={(event) => {
                    setTouched((currentTouched) => ({
                      ...currentTouched,
                      code: true,
                    }));
                    onCodeInput(event.target.value);
                  }}
                  onBlur={(event) => {
                    void checkUniqueCode(event.target.value);
                  }}
                />
                {touched.code && !code ? (
                  <p className={styles.error}>{t("COMMON.CODE_REQUIRED")}</p>
                ) : null}
                {touched.code && code && !ALPHANUMERIC_PATTERN.test(code) ? (
                  <p className={styles.error}>{t("COMMON.ALPHA_DECIMAL_RULE")}</p>
                ) : null}
                {!isCodeUnique ? (
                  <p className={styles.error}>{t("COMMON.CODE_EXISTS")}</p>
                ) : null}
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="brand-order">
                  {t("COMMON.ORDER")}
                </label>
                <input
                  id="brand-order"
                  className={styles.input}
                  value={order}
                  required
                  onChange={(event) => setOrder(event.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="brand-language">
                  {t("COMMON.LANGUAGE")} *
                </label>
                <select
                  id="brand-language"
                  className={styles.select}
                  value={selectedLanguage}
                  onChange={(event) => setSelectedLanguage(event.target.value)}
                >
                  {languages.map((language) => (
                    <option key={language} value={language}>
                      {t(`LANG.${language}`)}
                    </option>
                  ))}
                </select>
              </div>
              {current && currentIndex >= 0 ? (
                <>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="brand-name">
                      {t("DESCRIPTION_FORM.NAME")}
                    </label>
                    <input
                      id="brand-name"
                      className={styles.input}
                      value={current.name}
                      onChange={(event) => {
                        setTouched((currentTouched) => ({
                          ...currentTouched,
                          name: true,
                        }));
                        onNameChange(currentIndex, event.target.value);
                      }}
                    />
                    {touched.name && !current.name ? (
                      <p className={styles.error}>
                        {t("DESCRIPTION_FORM.NAME_REQUIRED")}
                      </p>
                    ) : null}
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="brand-highlight">
                      {t("DESCRIPTION_FORM.HIGHLIGHT")}
                    </label>
                    <input
                      id="brand-highlight"
                      className={styles.input}
                      value={current.highlights}
                      onChange={(event) =>
                        patchDescription(currentIndex, {
                          highlights: event.target.value,
                        })
                      }
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="brand-url">
                      {t("DESCRIPTION_FORM.FRIENDLY_URL")}
                    </label>
                    <input
                      id="brand-url"
                      className={styles.input}
                      value={current.friendlyUrl}
                      onChange={(event) => {
                        setTouched((currentTouched) => ({
                          ...currentTouched,
                          url: true,
                        }));
                        patchDescription(currentIndex, {
                          friendlyUrl: event.target.value,
                        });
                      }}
                    />
                    {touched.url && !current.friendlyUrl ? (
                      <p className={styles.error}>
                        {t("DESCRIPTION_FORM.FRIENDLY_URL_REQUIRED")}
                      </p>
                    ) : null}
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="brand-description">
                      {t("DESCRIPTION_FORM.DESCRIPTION")}
                    </label>
                    <textarea
                      id="brand-description"
                      className={styles.textarea}
                      value={current.description}
                      onChange={(event) =>
                        patchDescription(currentIndex, {
                          description: event.target.value,
                        })
                      }
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="brand-title">
                      {t("DESCRIPTION_FORM.TITLE")}
                    </label>
                    <input
                      id="brand-title"
                      className={styles.input}
                      value={current.title}
                      onChange={(event) =>
                        patchDescription(currentIndex, {
                          title: event.target.value,
                        })
                      }
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="brand-keywords">
                      {t("DESCRIPTION_FORM.KEYWORDS")}
                    </label>
                    <input
                      id="brand-keywords"
                      className={styles.input}
                      value={current.keyWords}
                      placeholder={t("DESCRIPTION_FORM.KEYWORDS_PLACEHOLDER")}
                      onChange={(event) =>
                        patchDescription(currentIndex, {
                          keyWords: event.target.value,
                        })
                      }
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="brand-meta">
                      {t("DESCRIPTION_FORM.META_DESCRIPTION")}
                    </label>
                    <input
                      id="brand-meta"
                      className={styles.input}
                      value={current.metaDescription}
                      placeholder={t("DESCRIPTION_FORM.DESCRIPTION")}
                      onChange={(event) =>
                        patchDescription(currentIndex, {
                          metaDescription: event.target.value,
                        })
                      }
                    />
                  </div>
                </>
              ) : null}
            </form>
          ) : null}
        </section>
      </div>
    </CatalogueGate>
  );
}
