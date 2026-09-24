"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { useI18n } from "@/components/i18n-provider";
import type { Language } from "@/lib/api/types";
import { getLang, getMerchant } from "@/lib/auth/session";
import {
  checkOptionCode,
  createOption,
  getOptionById,
  listStoreLanguages,
  updateOption,
} from "@/lib/catalogue/options-api";
import { isAlphanumeric, readApiErrorMessage } from "@/lib/catalogue/options-helpers";
import type { OptionDescription, ProductOption } from "@/lib/catalogue/options-types";
import { OPTION_TYPES } from "@/lib/catalogue/options-types";

import styles from "./options-page.module.css";

const LIST_PATH = "/pages/catalogue/options/options-list";

export function OptionForm({ optionId }: { optionId?: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const [loader, setLoader] = useState(true);
  const [saving, setSaving] = useState(false);
  const [option, setOption] = useState<ProductOption | null>(null);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [code, setCode] = useState("");
  const [type, setType] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState(getLang());
  const [descriptions, setDescriptions] = useState<OptionDescription[]>([]);
  const [codeTouched, setCodeTouched] = useState(false);
  const [isCodeUnique, setIsCodeUnique] = useState(true);
  const [banner, setBanner] = useState<{ kind: "error" | "success"; text: string } | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;
    const id = window.setTimeout(() => {
      void (async () => {
        setLoader(true);
        try {
          const langs = await listStoreLanguages(getMerchant() ?? "");
          if (cancelled) {
            return;
          }
          setLanguages(langs);
          let nextDescriptions = langs.map((lang) => ({
            language: lang.code,
            name: "",
          }));
          if (optionId) {
            const loaded = await getOptionById(optionId);
            if (cancelled) {
              return;
            }
            setOption(loaded);
            setCode(loaded.code ?? "");
            setType(loaded.type ?? "");
            setSelectedLanguage(getLang());
            nextDescriptions = nextDescriptions.map((desc) => {
              const match = loaded.descriptions?.find(
                (item) => item.language === desc.language,
              );
              return { ...desc, name: match?.name ?? "" };
            });
          }
          setDescriptions(nextDescriptions);
        } catch (error) {
          if (!cancelled) {
            setBanner({
              kind: "error",
              text: readApiErrorMessage(error, t("COMMON.INTERNAL_SERVER_ERROR")),
            });
          }
        } finally {
          if (!cancelled) {
            setLoader(false);
          }
        }
      })();
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [optionId, t]);

  const currentDescription = useMemo(
    () => descriptions.find((item) => item.language === selectedLanguage),
    [descriptions, selectedLanguage],
  );

  const codeError =
    codeTouched && !code.trim()
      ? t("COMMON.CODE_REQUIRED")
      : codeTouched && code.trim() && !isAlphanumeric(code.trim())
        ? t("COMMON.ALPHA_DECIMAL_RULE")
        : "";

  const formValid = Boolean(code.trim() && isAlphanumeric(code.trim()) && type);

  async function onCheckCode(next: string) {
    const trimmed = next.trim();
    setCode(trimmed);
    setCodeTouched(true);
    if (!trimmed) {
      return;
    }
    try {
      const res = await checkOptionCode(trimmed);
      setIsCodeUnique(!(res.exists && option?.code !== trimmed));
    } catch {
      setIsCodeUnique(true);
    }
  }

  function setName(name: string) {
    setDescriptions((current) =>
      current.map((item) =>
        item.language === selectedLanguage ? { ...item, name } : item,
      ),
    );
  }

  async function save() {
    if (!isCodeUnique) {
      setBanner({ kind: "error", text: t("COMMON.CODE_EXISTS") });
      return;
    }
    if (!formValid) {
      setCodeTouched(true);
      return;
    }
    setSaving(true);
    setBanner(null);
    const payload = {
      code: code.trim(),
      type,
      selectedLanguage,
      descriptions,
      ...(option?.id ? { id: option.id } : {}),
    };
    try {
      if (option?.id) {
        await updateOption(option.id, payload);
        setBanner({ kind: "success", text: t("OPTION.OPTION_UPDATED") });
      } else {
        await createOption(payload);
        setBanner({ kind: "success", text: t("OPTION.OPTION_CREATED") });
        router.push(LIST_PATH);
      }
    } catch (error) {
      setBanner({
        kind: "error",
        text: readApiErrorMessage(error, t("COMMON.INTERNAL_SERVER_ERROR")),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t("COMPONENTS.OPTIONS")}</h1>
        <div className={styles.toolbar}>
          <button
            type="button"
            className={styles.ghostButton}
            onClick={() => router.push(LIST_PATH)}
          >
            {t("ORDER_FORM.CANCLE")}
          </button>
          <button
            type="button"
            className={styles.primaryButton}
            disabled={!formValid || saving || loader}
            onClick={() => void save()}
          >
            {t("COMMON.SAVE")}
          </button>
        </div>
      </header>

      <section className={styles.card}>
        {banner ? (
          <p
            className={`${styles.banner} ${
              banner.kind === "error" ? styles.bannerError : styles.bannerSuccess
            }`}
            role={banner.kind === "error" ? "alert" : "status"}
          >
            {banner.text}
          </p>
        ) : null}

        {loader ? <p className={styles.status}>…</p> : null}

        {!loader ? (
          <>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="option-code">
                {t("COMMON.CODE")} *
              </label>
              <input
                id="option-code"
                className={styles.input}
                value={code}
                readOnly={!!option?.id}
                placeholder={t("COMMON.CODE")}
                onChange={(event) => setCode(event.target.value)}
                onBlur={(event) => void onCheckCode(event.target.value)}
              />
              {codeError ? <p className={styles.bannerError}>{codeError}</p> : null}
              {!isCodeUnique ? (
                <p className={styles.bannerError}>{t("COMMON.CODE_EXISTS")}</p>
              ) : null}
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="option-language">
                {t("COMMON.LANGUAGE")} *
              </label>
              <select
                id="option-language"
                className={styles.select}
                value={selectedLanguage}
                onChange={(event) => setSelectedLanguage(event.target.value)}
              >
                {languages.map((language) => (
                  <option key={language.code} value={language.code}>
                    {t(`LANG.${language.code}`)}
                  </option>
                ))}
              </select>
            </div>

            {currentDescription ? (
              <div className={styles.field}>
                <label className={styles.label} htmlFor="option-name">
                  {t("DESCRIPTION_FORM.NAME")} *
                </label>
                <input
                  id="option-name"
                  className={styles.input}
                  value={currentDescription.name}
                  placeholder={t("DESCRIPTION_FORM.NAME")}
                  onChange={(event) => setName(event.target.value)}
                />
              </div>
            ) : null}

            <div className={styles.field}>
              <label className={styles.label} htmlFor="option-type">
                {t("COMMON.TYPE")} *
              </label>
              <select
                id="option-type"
                className={styles.select}
                value={type}
                onChange={(event) => setType(event.target.value)}
              >
                <option value="">{t("COMMON.TYPE")}</option>
                {OPTION_TYPES.map((item) => (
                  <option key={item} value={item}>
                    {t(`COMMON.${item}`)}
                  </option>
                ))}
              </select>
            </div>
          </>
        ) : null}
      </section>
    </div>
  );
}
