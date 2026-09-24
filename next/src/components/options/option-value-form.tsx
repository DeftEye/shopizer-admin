"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { useI18n } from "@/components/i18n-provider";
import type { Language } from "@/lib/api/types";
import {
  checkOptionValueCode,
  createOptionValue,
  createOptionValueImage,
  deleteOptionValueImage,
  getOptionValueById,
  listSystemLanguages,
  updateOptionValue,
} from "@/lib/catalogue/options-api";
import { isAlphanumeric, readApiErrorMessage } from "@/lib/catalogue/options-helpers";
import type {
  OptionDescription,
  ProductOptionValue,
} from "@/lib/catalogue/options-types";

import styles from "./options-page.module.css";

const LIST_PATH = "/pages/catalogue/options/options-values-list";

export function OptionValueForm({ optionValueId }: { optionValueId?: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const [loader, setLoader] = useState(!!optionValueId);
  const [saving, setSaving] = useState(false);
  const [optionValue, setOptionValue] = useState<ProductOptionValue | null>(null);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [code, setCode] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [descriptions, setDescriptions] = useState<OptionDescription[]>([]);
  const [codeTouched, setCodeTouched] = useState(false);
  const [isCodeUnique, setIsCodeUnique] = useState(true);
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [banner, setBanner] = useState<{ kind: "error" | "success"; text: string } | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;
    const id = window.setTimeout(() => {
      void (async () => {
        try {
          const langs = await listSystemLanguages();
          if (cancelled) {
            return;
          }
          setLanguages(langs);
          let nextDescriptions = langs.map((lang) => ({
            language: lang.code,
            name: "",
          }));
          if (optionValueId) {
            setLoader(true);
            const loaded = await getOptionValueById(optionValueId);
            if (cancelled) {
              return;
            }
            setOptionValue(loaded);
            setCode(loaded.code ?? "");
            setSelectedLanguage("en");
            setImageUrl(loaded.image ?? "");
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
  }, [optionValueId, t]);

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

  const formValid = Boolean(code.trim() && isAlphanumeric(code.trim()));

  async function onCheckCode(next: string) {
    const trimmed = next.trim();
    setCode(trimmed);
    setCodeTouched(true);
    if (!trimmed) {
      return;
    }
    try {
      const res = await checkOptionValueCode(trimmed);
      setIsCodeUnique(!(res.exists && optionValue?.code !== trimmed));
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

  function onSelectFile(file: File | undefined) {
    if (!file) {
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setImageUrl(typeof reader.result === "string" ? reader.result : "");
    };
    reader.readAsDataURL(file);
  }

  function removeImage() {
    setImageFile(null);
    setImageUrl("");
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
      selectedLanguage,
      descriptions,
      ...(optionValue?.id ? { id: optionValue.id } : {}),
    };
    try {
      if (optionValue?.id) {
        await updateOptionValue(optionValue.id, payload);
        if (imageFile) {
          await createOptionValueImage(optionValue.id, imageFile);
        } else {
          await deleteOptionValueImage(optionValue.id);
        }
        setBanner({
          kind: "success",
          text: t("OPTION_VALUE.OPTION_VALUE_UPDATED"),
        });
      } else {
        const created = await createOptionValue(payload);
        if (imageFile && created.id) {
          await createOptionValueImage(created.id, imageFile);
          setBanner({
            kind: "success",
            text: t("OPTION_VALUE.OPTION_VALUE_UPDATED"),
          });
        } else {
          setBanner({
            kind: "success",
            text: t("OPTION_VALUE.OPTION_VALUE_CREATED"),
          });
        }
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
        <h1 className={styles.title}>{t("COMPONENTS.OPTIONS_VALUE")}</h1>
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

        <div className={styles.field}>
          <label className={styles.label} htmlFor="option-value-code">
            {t("COMMON.CODE")}
          </label>
          <input
            id="option-value-code"
            className={styles.input}
            value={code}
            readOnly={!!optionValue?.id}
            placeholder={t("COMMON.CODE")}
            onChange={(event) => setCode(event.target.value)}
            onBlur={(event) => void onCheckCode(event.target.value)}
          />
          {codeError ? <p className={styles.bannerError}>{codeError}</p> : null}
          {!isCodeUnique ? (
            <p className={styles.bannerError}>{t("COMMON.CODE_EXISTS")}</p>
          ) : null}
        </div>

        {languages.length > 0 ? (
          <div className={styles.field}>
            <label className={styles.label} htmlFor="option-value-language">
              {t("COMMON.LANGUAGE")} *
            </label>
            <select
              id="option-value-language"
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
        ) : null}

        {selectedLanguage && currentDescription ? (
          <div className={styles.field}>
            <label className={styles.label} htmlFor="option-value-name">
              {t("DESCRIPTION_FORM.NAME")} *
            </label>
            <input
              id="option-value-name"
              className={styles.input}
              value={currentDescription.name}
              placeholder={t("DESCRIPTION_FORM.NAME")}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
        ) : null}

        <div className={styles.field}>
          <span className={styles.label}>{t("DESCRIPTION_FORM.IMAGE")}</span>
          {imageUrl ? (
            <div className={styles.imagePreview}>
              {/* Existing Shopizer image URL or local object preview */}
              <img src={imageUrl} alt="" />
              <button
                type="button"
                className={styles.dangerButton}
                onClick={removeImage}
              >
                {t("COMMON.REMOVE")}
              </button>
            </div>
          ) : null}
          <input
            id="option-value-image"
            type="file"
            accept="image/jpeg,image/gif,image/png,image/jpg"
            onChange={(event) => onSelectFile(event.target.files?.[0])}
          />
          <button
            type="button"
            className={styles.ghostButton}
            onClick={() =>
              document.getElementById("option-value-image")?.click()
            }
          >
            {t("COMMON.ADD_IMAGE")}
          </button>
        </div>
      </section>
    </div>
  );
}
