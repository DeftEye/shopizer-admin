"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useI18n } from "@/components/i18n-provider";
import { getLang } from "@/lib/auth/session";
import {
  checkOptionSetCode,
  createOptionSet,
  getOptionSetById,
  listOptionValues,
  listOptions,
  listProductTypes,
  updateOptionSet,
} from "@/lib/catalogue/options-api";
import {
  isAlphanumeric,
  nameFromDescriptions,
  readApiErrorMessage,
} from "@/lib/catalogue/options-helpers";
import type { NamedRef, ProductType } from "@/lib/catalogue/options-types";

import styles from "./options-page.module.css";

const LIST_PATH = "/pages/catalogue/options/options-set-list";

type Choice = { id: number; code: string; name: string };

function selectedNumbers(select: HTMLSelectElement): number[] {
  return Array.from(select.selectedOptions)
    .map((option) => Number(option.value))
    .filter((value) => !Number.isNaN(value));
}

export function OptionSetForm({ optionId }: { optionId?: string }) {
  const { t, lang } = useI18n();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [setId, setSetId] = useState<number | "">("");
  const [code, setCode] = useState("");
  const [readOnly, setReadOnly] = useState(false);
  const [option, setOption] = useState<string>("");
  const [optionValues, setOptionValues] = useState<number[]>([]);
  const [productTypes, setProductTypes] = useState<number[]>([]);
  const [productOption, setProductOption] = useState<Choice[]>([]);
  const [productOptionValue, setProductOptionValue] = useState<Choice[]>([]);
  const [types, setTypes] = useState<ProductType[]>([]);
  const [codeTouched, setCodeTouched] = useState(false);
  const [isCodeExist, setIsCodeExist] = useState(false);
  const [isValidCode, setIsValidCode] = useState(true);
  const [isValidOption, setIsValidOption] = useState(true);
  const [banner, setBanner] = useState<{ kind: "error" | "success"; text: string } | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;
    const id = window.setTimeout(() => {
      void (async () => {
        setLoading(true);
        try {
          const [optionsRes, valuesRes, typesRes] = await Promise.all([
            listOptions({}),
            listOptionValues({}),
            listProductTypes(),
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
          setTypes(typesRes.list ?? []);

          if (optionId) {
            const loaded = await getOptionSetById(optionId);
            if (cancelled) {
              return;
            }
            setSetId(loaded.id ?? "");
            setCode(loaded.code ?? "");
            setReadOnly(!!loaded.readOnly);
            setOption(loaded.option?.id != null ? String(loaded.option.id) : "");
            setOptionValues(
              (loaded.values ?? []).map((item: NamedRef) => item.id),
            );
            setProductTypes(
              (loaded.productTypes ?? []).map((item: NamedRef) => item.id),
            );
          }
        } catch (error) {
          if (!cancelled) {
            setBanner({
              kind: "error",
              text: readApiErrorMessage(error, t("COMMON.INTERNAL_SERVER_ERROR")),
            });
          }
        } finally {
          if (!cancelled) {
            setLoading(false);
          }
        }
      })();
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [lang, optionId, t]);

  const codeError =
    codeTouched && !code.trim()
      ? t("COMMON.CODE_REQUIRED")
      : codeTouched && code.trim() && !isAlphanumeric(code.trim())
        ? t("COMMON.ALPHA_DECIMAL_RULE")
        : "";

  async function onCheckCode(next: string) {
    setIsValidCode(true);
    const trimmed = next.trim();
    setCode(trimmed);
    setCodeTouched(true);
    try {
      const res = await checkOptionSetCode(trimmed);
      setIsCodeExist(!!res.exists);
    } catch {
      setIsCodeExist(false);
    }
  }

  async function save() {
    setSaving(true);
    setIsValidCode(true);
    setIsValidOption(true);
    const invalidCode = !code.trim() || !isAlphanumeric(code.trim());
    const invalidOption = !option;
    if (invalidCode || invalidOption) {
      setIsValidCode(!invalidCode);
      setIsValidOption(!invalidOption);
      setCodeTouched(true);
      setSaving(false);
      return;
    }

    const payload = {
      readOnly,
      ...(setId ? {} : { code: code.trim() }),
      option: Number(option),
      optionValues,
      productTypes,
    };

    try {
      if (setId) {
        await updateOptionSet(setId, payload);
        setBanner({ kind: "success", text: t("OPTION.SET_OPTION_UPDATED") });
      } else {
        await createOptionSet({ ...payload, code: code.trim() });
        setBanner({ kind: "success", text: t("OPTION.SET_OPTION_CREATED") });
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
        <h1 className={styles.title}>{t("COMPONENTS.SET_OPTION")}</h1>
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
            disabled={saving}
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
        {loading ? <p className={styles.status}>…</p> : null}

        <div className={styles.field}>
          <label className={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={readOnly}
              onChange={(event) => setReadOnly(event.target.checked)}
            />
            {t("COMMON.READ_ONLY")}
          </label>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="option-set-code">
            {t("COMMON.CODE")} *
          </label>
          <input
            id="option-set-code"
            className={styles.input}
            value={code}
            readOnly={!!setId}
            onChange={(event) => setCode(event.target.value)}
            onBlur={(event) => void onCheckCode(event.target.value)}
          />
          {codeError ? <p className={styles.bannerError}>{codeError}</p> : null}
          {isCodeExist ? (
            <p className={styles.bannerError}>{t("COMMON.CODE_EXISTS")}</p>
          ) : null}
          {!isValidCode ? (
            <p className={styles.bannerError}>{t("COMMON.CODE_REQUIRED")}</p>
          ) : null}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="option-set-option">
            {t("OPTION.OPTION_NAME")} *
          </label>
          <select
            id="option-set-option"
            className={styles.select}
            value={option}
            onClick={() => setIsValidOption(true)}
            onChange={(event) => {
              setIsValidOption(true);
              setOption(event.target.value);
            }}
          >
            <option value="">{t("OPTION_SET.SELECT_OPTION_NAME")}</option>
            {productOption.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          {!isValidOption ? (
            <p className={styles.bannerError}>{t("DESCRIPTION_FORM.NAME_REQUIRED")}</p>
          ) : null}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="option-set-values">
            {t("OPTION_VALUE.OPTION_VALUE")}
          </label>
          <select
            id="option-set-values"
            className={styles.select}
            multiple
            value={optionValues.map(String)}
            onChange={(event) =>
              setOptionValues(selectedNumbers(event.currentTarget))
            }
          >
            {productOptionValue.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="option-set-types">
            {t("PRODUCT_TYPE.PRODUCT_TYPE")}
          </label>
          <select
            id="option-set-types"
            className={styles.select}
            multiple
            value={productTypes.map(String)}
            onChange={(event) =>
              setProductTypes(selectedNumbers(event.currentTarget))
            }
          >
            {types.map((item) => (
              <option key={item.id} value={item.id}>
                {item.code}
              </option>
            ))}
          </select>
        </div>
      </section>
    </div>
  );
}
