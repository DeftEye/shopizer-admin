"use client";

import { useEffect, useState } from "react";

import { useI18n } from "@/components/i18n-provider";
import {
  getInventoryById,
  getSupportedLanguages,
  updateInventory,
  type InventoryItem,
  type InventoryPrice,
  type LanguageOption,
  type ProductDescription,
} from "@/lib/api/product-children";
import { getMerchant } from "@/lib/auth/session";
import { slugify } from "@/lib/slugify";
import { formatIsoDate } from "@/lib/validation";

import { BackButton } from "./back-button";
import styles from "../product-children.module.css";

type Desc = {
  language: string;
  name: string;
  highlights: string;
  friendlyUrl: string;
  description: string;
  title: string;
  keyWords: string;
  metaDescription: string;
};

function emptyDesc(language: string): Desc {
  return {
    language,
    name: "",
    highlights: "",
    friendlyUrl: "",
    description: "",
    title: "",
    keyWords: "",
    metaDescription: "",
  };
}

function stripCurrency(value?: string) {
  if (!value) {
    return "";
  }
  return value.slice(3);
}

export function PriceForm({
  productId,
  inventoryId,
  priceId,
}: {
  productId: string;
  inventoryId: string;
  priceId?: string;
}) {
  const { t } = useI18n();
  const [loader, setLoader] = useState(true);
  const [inventory, setInventory] = useState<InventoryItem>({});
  const [languages, setLanguages] = useState<LanguageOption[]>([]);
  const [finalPrice, setFinalPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [discountedPrice, setDiscountedPrice] = useState("");
  const [discounted, setDiscounted] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [descriptions, setDescriptions] = useState<Desc[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    getInventoryById(productId, inventoryId)
      .then((res) => {
        setInventory(res);
        return getSupportedLanguages(getMerchant()).then((langs) => {
          setLanguages(langs);
          const next = langs.map((lang) => emptyDesc(lang.code));
          if (priceId) {
            const price = (res.prices ?? []).find(
              (row) => row.id && String(row.id) === String(priceId),
            );
            if (price) {
              setFinalPrice(stripCurrency(price.finalPrice));
              setOriginalPrice(stripCurrency(price.originalPrice));
              setDiscountedPrice(stripCurrency(price.discountedPrice));
              setDiscounted(String(price.discounted ?? ""));
              setSelectedLanguage("en");
              setDescriptions(
                next.map((desc) => {
                  const match = (price.descriptions ?? []).find(
                    (item) => item.language === desc.language,
                  );
                  return match
                    ? {
                        language: match.language ?? desc.language,
                        name: match.name ?? "",
                        highlights: match.highlights ?? "",
                        friendlyUrl: match.friendlyUrl ?? "",
                        description: match.description ?? "",
                        title: match.title ?? "",
                        keyWords: match.keyWords ?? "",
                        metaDescription: match.metaDescription ?? "",
                      }
                    : desc;
                }),
              );
              return;
            }
          }
          setDescriptions(next);
        });
      })
      .finally(() => setLoader(false));
  }, [inventoryId, priceId, productId]);

  function patchDesc(index: number, patch: Partial<Desc>) {
    setDescriptions((current) =>
      current.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  }

  async function save() {
    const priceObject: InventoryPrice & {
      dateAvailable?: string;
      sku?: string;
      descriptions: ProductDescription[];
    } = {
      finalPrice,
      originalPrice,
      discountedPrice,
      discounted,
      descriptions,
      dateAvailable: formatIsoDate(new Date()),
    };

    const tmpObj: Record<string, string> = { name: "", friendlyUrl: "" };
    priceObject.descriptions.forEach((el) => {
      if (tmpObj.name === "" && el.name) {
        tmpObj.name = el.name;
      }
      if (tmpObj.friendlyUrl === "" && el.friendlyUrl) {
        tmpObj.friendlyUrl = el.friendlyUrl;
      }
      for (const elKey of Object.keys(el)) {
        const value = (el as Record<string, string | undefined>)[elKey];
        if (value && !tmpObj[elKey]) {
          tmpObj[elKey] = value;
        }
      }
    });

    if (tmpObj.name === "" || tmpObj.friendlyUrl === "") {
      setError(t("COMMON.FILL_REQUIRED_FIELDS"));
      return;
    }

    priceObject.descriptions.forEach((el) => {
      const record = el as Record<string, string | undefined>;
      for (const elKey of Object.keys(el)) {
        if (!record[elKey] && tmpObj[elKey]) {
          record[elKey] = tmpObj[elKey];
        }
        if (typeof record[elKey] === "undefined") {
          record[elKey] = "";
        }
      }
    });

    const nextInventory: InventoryItem = { ...inventory };
    const storeCode =
      typeof nextInventory.store === "string"
        ? nextInventory.store
        : nextInventory.store?.code;
    nextInventory.store = storeCode;
    (nextInventory.prices ?? []).forEach((el) => {
      const originalMatch = el.originalPrice?.match(/\d/);
      if (originalMatch && originalMatch.index !== undefined) {
        el.originalPrice = el.originalPrice?.slice(originalMatch.index);
      }
      const finalMatch = el.finalPrice?.match(/\d/);
      if (finalMatch && finalMatch.index !== undefined) {
        el.finalPrice = el.finalPrice?.slice(finalMatch.index);
      }
    });
    nextInventory.prices = [...(nextInventory.prices ?? []), priceObject];
    await updateInventory(productId, String(nextInventory.id), nextInventory);
  }

  const current = descriptions.find((desc) => desc.language === selectedLanguage);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t("COMPONENTS.PRICE")}</h1>
        <div className={styles.actions}>
          <BackButton />
          <button
            type="button"
            className={styles.primary}
            disabled={loader}
            onClick={() => void save()}
          >
            {loader ? "" : t("COMMON.SAVE")}
          </button>
        </div>
      </div>
      <section className={styles.card}>
        <div className={styles.body}>
          {error ? <p className={styles.error}>{error}</p> : null}
          <div className={styles.field}>
            <label className={styles.label} htmlFor="finalPrice">
              {t("PRICE.FINAL_PRICE")}
            </label>
            <input
              id="finalPrice"
              type="number"
              className={styles.input}
              required
              value={finalPrice}
              onChange={(event) => setFinalPrice(event.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="originalPrice">
              {t("PRICE.ORIGINAL_PRICE")}
            </label>
            <input
              id="originalPrice"
              type="number"
              className={styles.input}
              required
              value={originalPrice}
              onChange={(event) => setOriginalPrice(event.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="discountedPrice">
              {t("PRICE.DISCOUNTED_PRICE")}
            </label>
            <input
              id="discountedPrice"
              type="number"
              className={styles.input}
              value={discountedPrice}
              onChange={(event) => setDiscountedPrice(event.target.value)}
            />
          </div>
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={discounted === "true" || discounted === "1"}
              onChange={(event) =>
                setDiscounted(event.target.checked ? "true" : "")
              }
            />
            {t("PRICE.DISCOUNTED")}
          </label>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="selectedLanguage">
              {t("COMMON.LANGUAGE")} *
            </label>
            <select
              id="selectedLanguage"
              className={styles.select}
              value={selectedLanguage}
              onChange={(event) => setSelectedLanguage(event.target.value)}
            >
              <option value="" />
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.code}
                </option>
              ))}
            </select>
          </div>
          {selectedLanguage && current
            ? descriptions.map((desc, index) =>
                desc.language === selectedLanguage ? (
                  <div key={desc.language}>
                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="name">
                        {t("DESCRIPTION_FORM.NAME")} *
                      </label>
                      <input
                        id="name"
                        className={styles.input}
                        value={desc.name}
                        onChange={(event) => {
                          const name = event.target.value;
                          patchDesc(index, { name, friendlyUrl: slugify(name) });
                        }}
                      />
                      {!desc.name ? (
                        <span className={styles.error}>
                          {t("DESCRIPTION_FORM.NAME_REQUIRED")}
                        </span>
                      ) : null}
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="highlight">
                        {t("DESCRIPTION_FORM.HIGHLIGHT")}
                      </label>
                      <input
                        id="highlight"
                        className={styles.input}
                        value={desc.highlights}
                        onChange={(event) =>
                          patchDesc(index, { highlights: event.target.value })
                        }
                      />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="friendlyUrl">
                        {t("DESCRIPTION_FORM.FRIENDLY_URL")}
                      </label>
                      <input
                        id="friendlyUrl"
                        className={styles.input}
                        value={desc.friendlyUrl}
                        onChange={(event) =>
                          patchDesc(index, { friendlyUrl: event.target.value })
                        }
                      />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="description">
                        {t("DESCRIPTION_FORM.DESCRIPTION")}
                      </label>
                      <textarea
                        id="description"
                        className={styles.textarea}
                        value={desc.description}
                        onChange={(event) =>
                          patchDesc(index, { description: event.target.value })
                        }
                      />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="title">
                        {t("DESCRIPTION_FORM.TITLE")}
                      </label>
                      <input
                        id="title"
                        className={styles.input}
                        value={desc.title}
                        onChange={(event) =>
                          patchDesc(index, { title: event.target.value })
                        }
                      />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="keyWords">
                        {t("DESCRIPTION_FORM.KEYWORDS")}
                      </label>
                      <input
                        id="keyWords"
                        className={styles.input}
                        value={desc.keyWords}
                        onChange={(event) =>
                          patchDesc(index, { keyWords: event.target.value })
                        }
                      />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="metaDescription">
                        {t("DESCRIPTION_FORM.META_DESCRIPTION")}
                      </label>
                      <input
                        id="metaDescription"
                        className={styles.input}
                        value={desc.metaDescription}
                        onChange={(event) =>
                          patchDesc(index, { metaDescription: event.target.value })
                        }
                      />
                    </div>
                  </div>
                ) : null,
              )
            : null}
        </div>
      </section>
    </div>
  );
}
