"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { CatalogueGate } from "@/components/catalogue-gate";
import { useI18n } from "@/components/i18n-provider";
import { getStoreLanguages } from "@/lib/api/catalog";
import {
  checkTypeCode,
  createType,
  fillEmptyTypeDescriptions,
  getType,
  updateType,
} from "@/lib/api/product-types";
import type { ProductTypeDescription } from "@/lib/api/types";
import { getLang, getMerchant } from "@/lib/auth/session";
import { ALPHANUMERIC_PATTERN } from "@/lib/constants";

import styles from "../catalog.module.css";

export function TypeForm({ typeId }: { typeId?: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const [languages, setLanguages] = useState<string[]>([]);
  const [code, setCode] = useState("");
  const [allowAddToCart, setAllowAddToCart] = useState(true);
  const [visible, setVisible] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(getLang());
  const [descriptions, setDescriptions] = useState<ProductTypeDescription[]>([]);
  const [existingId, setExistingId] = useState<string | number>("");
  const [isReadonlyCode, setIsReadonlyCode] = useState(false);
  const [isCodeExist, setIsCodeExist] = useState(false);
  const [isValidCode, setIsValidCode] = useState(true);
  const [loader, setLoader] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [touched, setTouched] = useState(false);
  const codeCheckSeq = useRef(0);
  const saveInFlight = useRef(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoader(true);
      try {
        const langs = await getStoreLanguages(getMerchant() ?? "");
        const codes = langs.map((lang) => lang.code);
        let nextDescriptions = codes.map((language) => ({
          language,
          name: "",
        }));
        if (typeId) {
          const productType = await getType(typeId, {
            lang: "_all",
            store: getMerchant() ?? "",
          });
          if (cancelled) {
            return;
          }
          setExistingId(productType.id ?? typeId);
          setCode(productType.code ?? "");
          setAllowAddToCart(!!productType.allowAddToCart);
          setVisible(!!productType.visible);
          setIsReadonlyCode(true);
          nextDescriptions = codes.map((language) => {
            const existing = productType.descriptions?.find(
              (item) => item.language === language,
            );
            return { language, name: existing?.name ?? "" };
          });
        }
        if (cancelled) {
          return;
        }
        setLanguages(codes);
        setSelectedLanguage(getLang());
        setDescriptions(nextDescriptions);
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
  }, [t, typeId]);

  const currentIndex = useMemo(
    () => descriptions.findIndex((item) => item.language === selectedLanguage),
    [descriptions, selectedLanguage],
  );
  const current = currentIndex >= 0 ? descriptions[currentIndex] : null;

  function onCodeInput(next: string) {
    setCode(next);
    setIsValidCode(true);
    if (!next.trim()) {
      codeCheckSeq.current += 1;
      setIsCodeExist(false);
    }
  }

  async function checkUniqueCode(next: string) {
    const trimmed = next.trim();
    if (existingId || isReadonlyCode) {
      setIsCodeExist(false);
      return;
    }
    const seq = ++codeCheckSeq.current;
    if (!trimmed) {
      setIsCodeExist(false);
      return;
    }
    try {
      const res = await checkTypeCode(trimmed);
      if (seq !== codeCheckSeq.current) {
        return;
      }
      setIsCodeExist(!!res.exists);
    } catch {
      if (seq !== codeCheckSeq.current) {
        return;
      }
      setIsCodeExist(false);
    }
  }

  async function save() {
    if (saveInFlight.current) {
      return;
    }
    setTouched(true);
    setError("");
    setMessage("");
    const validCode = !!code && ALPHANUMERIC_PATTERN.test(code);
    setIsValidCode(validCode);
    const filled = fillEmptyTypeDescriptions(descriptions);
    if (!validCode) {
      return;
    }
    if (!filled) {
      setError(t("COMMON.FILL_REQUIRED_FIELDS"));
      return;
    }
    saveInFlight.current = true;
    setSaving(true);
    const body: Record<string, unknown> = {
      allowAddToCart,
      visible,
      selectedLanguage,
      descriptions: filled,
    };
    if (!existingId) {
      body.code = code;
    }
    try {
      if (!existingId) {
        const res = await checkTypeCode(code.trim());
        if (res.exists) {
          setIsCodeExist(true);
          setError(t("COMMON.CODE_EXISTS"));
          return;
        }
        setIsCodeExist(false);
      }
      if (existingId) {
        await updateType(existingId, body);
        setMessage(t("PRODUCT_TYPE.PRODUCT_TYPE_UPDATED"));
      } else {
        await createType(body);
        setMessage(t("PRODUCT_TYPE.PRODUCT_TYPE_CREATED"));
        router.push("/pages/catalogue/types/types-list");
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
          <h1 className={styles.title}>{t("PRODUCT_TYPE.PRODUCT_TYPE_DETAILS")}</h1>
          <button
            type="button"
            className={styles.secondary}
            onClick={() => router.push("/pages/catalogue/types/types-list")}
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
              <div className={styles.checks}>
                <label className={styles.check}>
                  <input
                    type="checkbox"
                    checked={allowAddToCart}
                    onChange={(event) => setAllowAddToCart(event.target.checked)}
                  />
                  {t("PRODUCT_TYPE.ALLOW_ADD_TO_CART")}
                </label>
                <label className={styles.check}>
                  <input
                    type="checkbox"
                    checked={visible}
                    onChange={(event) => setVisible(event.target.checked)}
                  />
                  {t("CONTENT.VISIBLE")}
                </label>
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="type-code">
                  {t("COMMON.CODE")} *
                </label>
                <input
                  id="type-code"
                  className={styles.input}
                  value={code}
                  readOnly={isReadonlyCode}
                  required
                  onChange={(event) => {
                    setTouched(true);
                    onCodeInput(event.target.value);
                  }}
                  onBlur={(event) => {
                    void checkUniqueCode(event.target.value);
                  }}
                />
                {touched && !code ? (
                  <p className={styles.error}>{t("COMMON.CODE_REQUIRED")}</p>
                ) : null}
                {touched && code && !ALPHANUMERIC_PATTERN.test(code) ? (
                  <p className={styles.error}>{t("COMMON.ALPHA_DECIMAL_RULE")}</p>
                ) : null}
                {isCodeExist ? (
                  <p className={styles.error}>{t("COMMON.CODE_EXISTS")}</p>
                ) : null}
                {!isValidCode ? (
                  <p className={styles.error}>{t("COMMON.CODE_REQUIRED")}</p>
                ) : null}
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="type-language">
                  {t("COMMON.LANGUAGE")} *
                </label>
                <select
                  id="type-language"
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
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="type-name">
                    {t("COMMON.NAME")}*
                  </label>
                  <input
                    id="type-name"
                    className={styles.input}
                    value={current.name}
                    required
                    onChange={(event) =>
                      setDescriptions((items) =>
                        items.map((item, index) =>
                          index === currentIndex
                            ? { ...item, name: event.target.value }
                            : item,
                        ),
                      )
                    }
                  />
                </div>
              ) : null}
            </form>
          ) : null}
        </section>
      </div>
    </CatalogueGate>
  );
}
