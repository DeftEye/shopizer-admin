"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useI18n } from "@/components/i18n-provider";
import { getLang } from "@/lib/auth/session";
import {
  checkVariationCode,
  createVariation,
  listOptionValues,
  listOptions,
} from "@/lib/catalogue/options-api";
import {
  isAlphanumeric,
  nameFromDescriptions,
  readApiErrorMessage,
} from "@/lib/catalogue/options-helpers";

import styles from "./options-page.module.css";

const LIST_PATH = "/pages/catalogue/options/variations/list";

type Choice = { id: number; code: string; name: string };

export function VariationForm() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [code, setCode] = useState("");
  const [option, setOption] = useState("");
  const [optionValue, setOptionValue] = useState("");
  const [productOption, setProductOption] = useState<Choice[]>([]);
  const [productOptionValue, setProductOptionValue] = useState<Choice[]>([]);
  const [codeTouched, setCodeTouched] = useState(false);
  const [optionTouched, setOptionTouched] = useState(false);
  const [optionValueTouched, setOptionValueTouched] = useState(false);
  const [isCodeExist, setIsCodeExist] = useState(false);
  const [banner, setBanner] = useState<{ kind: "error" | "success"; text: string } | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;
    const id = window.setTimeout(() => {
      void (async () => {
        try {
          const [optionsRes, valuesRes] = await Promise.all([
            listOptions({}),
            listOptionValues({}),
          ]);
          if (cancelled) {
            return;
          }
          setProductOption(
            (optionsRes.options ?? []).map((item) => ({
              id: Number(item.id),
              code: item.code,
              name: nameFromDescriptions(item.descriptions, lang || getLang()),
            })),
          );
          setProductOptionValue(
            (valuesRes.optionValues ?? []).map((item) => ({
              id: Number(item.id),
              code: item.code,
              name: nameFromDescriptions(item.descriptions, lang || getLang()),
            })),
          );
        } catch (error) {
          if (!cancelled) {
            setBanner({
              kind: "error",
              text: readApiErrorMessage(error, t("COMMON.INTERNAL_SERVER_ERROR")),
            });
          }
        }
      })();
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [lang, t]);

  const codeError =
    codeTouched && !code.trim()
      ? t("COMMON.CODE_REQUIRED")
      : codeTouched && code.trim() && !isAlphanumeric(code.trim())
        ? t("COMMON.ALPHA_DECIMAL_RULE")
        : "";

  const formValid = Boolean(
    code.trim() && isAlphanumeric(code.trim()) && option && optionValue,
  );

  async function onCheckCode(next: string) {
    const trimmed = next.trim();
    setCode(trimmed);
    setCodeTouched(true);
    try {
      const res = await checkVariationCode(trimmed);
      setIsCodeExist(!!res.exists);
    } catch {
      setIsCodeExist(false);
    }
  }

  async function save() {
    if (!formValid) {
      setCodeTouched(true);
      setOptionTouched(true);
      setOptionValueTouched(true);
      return;
    }
    setSaving(true);
    setBanner(null);
    try {
      await createVariation({
        code: code.trim(),
        option: Number(option),
        optionValue: Number(optionValue),
      });
      setBanner({ kind: "success", text: t("OPTION.SET_OPTION_CREATED") });
      router.push(LIST_PATH);
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
        <h1 className={styles.title}>{t("COMPONENTS.ADD_VARIATIONS")}</h1>
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
            disabled={!formValid || saving}
            onClick={() => void save()}
          >
            {saving ? "" : t("COMMON.SAVE")}
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

        <div className={styles.field}>
          <label className={styles.label} htmlFor="variation-code">
            {t("COMMON.CODE")} *
          </label>
          <input
            id="variation-code"
            className={styles.input}
            value={code}
            placeholder="Please enter unique code"
            onChange={(event) => setCode(event.target.value)}
            onBlur={(event) => void onCheckCode(event.target.value)}
          />
          {codeError ? <p className={styles.bannerError}>{codeError}</p> : null}
          {isCodeExist ? (
            <p className={styles.bannerError}>{t("COMMON.CODE_EXISTS")}</p>
          ) : null}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="variation-option">
            {t("OPTION.OPTION_NAME")} *
          </label>
          <select
            id="variation-option"
            className={styles.select}
            value={option}
            onBlur={() => setOptionTouched(true)}
            onChange={(event) => setOption(event.target.value)}
          >
            <option value="">{t("OPTION_SET.SELECT_OPTION_NAME")}</option>
            {productOption.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          {optionTouched && !option ? (
            <p className={styles.bannerError}>{t("COMMON.VALUE_REQUIRED")}</p>
          ) : null}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="variation-option-value">
            {t("OPTION_VALUE.OPTION_VALUE")}
          </label>
          <select
            id="variation-option-value"
            className={styles.select}
            value={optionValue}
            onBlur={() => setOptionValueTouched(true)}
            onChange={(event) => setOptionValue(event.target.value)}
          >
            <option value="">{t("OPTION_SET.ADD_OPTION_VALUE")}</option>
            {productOptionValue.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          {optionValueTouched && !optionValue ? (
            <p className={styles.bannerError}>{t("COMMON.VALUE_REQUIRED")}</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
