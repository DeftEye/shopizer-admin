"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { useI18n } from "@/components/i18n-provider";
import { ALPHANUMERIC_PATTERN, NUMBER_PATTERN } from "@/lib/catalogue/constants";
import {
  buildProductPayload,
  emptyDescription,
  emptyProductForm,
  formFromProduct,
} from "@/lib/catalogue/product-payload";
import {
  checkProductSku,
  createProduct,
  getManufacturers,
  getProductTypes,
  getStoreLanguages,
  readApiErrorMessage,
  updateProduct,
} from "@/lib/catalogue/products-api";
import { slugify } from "@/lib/catalogue/slugify";
import type {
  ProductDefinitionForm,
  ProductDetail,
  ProductDescription,
} from "@/lib/catalogue/types";
import { getLang, getMerchant } from "@/lib/auth/session";

import styles from "./product-form.module.css";

export function ProductForm({
  product,
  titleKey,
}: {
  product: ProductDetail;
  titleKey: string;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [form, setForm] = useState<ProductDefinitionForm>(() =>
    emptyProductForm(getLang()),
  );
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [skuUnique, setSkuUnique] = useState(true);
  const [manufacturers, setManufacturers] = useState<string[]>([]);
  const [productTypes, setProductTypes] = useState<string[]>([]);
  const [banner, setBanner] = useState<{ kind: "error" | "success"; text: string } | null>(
    null,
  );

  useEffect(() => {
    const store = getMerchant() ?? "";
    const lang = getLang();
    let cancelled = false;

    Promise.all([
      getManufacturers(),
      getProductTypes(),
      getStoreLanguages(store),
    ])
      .then(([manufacturerRes, typeRes, languages]) => {
        if (cancelled) {
          return;
        }
        const langs = Array.isArray(languages) ? languages : [];
        setManufacturers(
          (manufacturerRes.manufacturers ?? [])
            .map((item) => item.code)
            .filter((code): code is string => !!code),
        );
        setProductTypes(
          (typeRes.list ?? [])
            .map((item) => item.code)
            .filter((code): code is string => !!code),
        );
        const next = product.id
          ? formFromProduct(product, langs, lang)
          : {
              ...emptyProductForm(lang),
              descriptions: langs.map((item) => emptyDescription(item.code)),
            };
        setForm(next);
        setLoaded(true);
      })
      .catch((error) => {
        if (!cancelled) {
          setBanner({
            kind: "error",
            text: readApiErrorMessage(error, t("COMMON.INTERNAL_SERVER_ERROR")),
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [product, product.id, t]);

  const current = useMemo(
    () =>
      form.descriptions.find(
        (description) => description.language === form.selectedLanguage,
      ),
    [form.descriptions, form.selectedLanguage],
  );

  function patchForm(partial: Partial<ProductDefinitionForm>) {
    setForm((prev) => ({ ...prev, ...partial }));
  }

  function patchDescription(
    language: string,
    partial: Partial<ProductDescription>,
  ) {
    setForm((prev) => ({
      ...prev,
      descriptions: prev.descriptions.map((description) =>
        description.language === language
          ? { ...description, ...partial }
          : description,
      ),
    }));
  }

  async function onSkuChange(value: string) {
    patchForm({ sku: value });
    if (!value) {
      setSkuUnique(true);
      return;
    }
    setLoading(true);
    try {
      const result = await checkProductSku(value);
      setSkuUnique(!(result.exists && product.sku !== value));
    } catch {
      setSkuUnique(true);
    } finally {
      setLoading(false);
    }
  }

  function onNameChange(value: string) {
    if (!current) {
      return;
    }
    patchDescription(current.language, {
      name: value,
      friendlyUrl: slugify(value),
    });
  }

  async function onSave() {
    setSubmitted(true);
    setBanner(null);
    const store = getMerchant() ?? "";
    const { payload, missing, requiredMissing } = buildProductPayload(
      form,
      store,
    );
    if (missing.length > 0) {
      setBanner({
        kind: "error",
        text: `${t("COMMON.FILL_REQUIRED_FIELDS")} [${missing}]`,
      });
      return;
    }
    if (requiredMissing) {
      setBanner({ kind: "error", text: t("COMMON.FILL_REQUIRED_FIELDS") });
      return;
    }

    setLoading(true);
    try {
      if (product.id) {
        await updateProduct(product.id, payload, store);
        setBanner({ kind: "success", text: t("PRODUCT.PRODUCT_UPDATED") });
      } else {
        await createProduct(payload, store);
        setBanner({ kind: "success", text: t("PRODUCT.PRODUCT_CREATED") });
        router.push("/pages/catalogue/products/products-list");
      }
    } catch (error) {
      setBanner({
        kind: "error",
        text: readApiErrorMessage(error, t("COMMON.INTERNAL_SERVER_ERROR")),
      });
    } finally {
      setLoading(false);
    }
  }

  const skuError =
    submitted && !form.sku
      ? t("PRODUCT.ID_REQUIRED")
      : submitted && form.sku && !ALPHANUMERIC_PATTERN.test(form.sku)
        ? t("COMMON.ALPHA_DECIMAL_RULE")
        : "";

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t(titleKey)}</h1>
        <button
          type="button"
          className={styles.cancel}
          onClick={() => router.push("/pages/catalogue/products/products-list")}
        >
          {t("ORDER_FORM.CANCLE")}
        </button>
      </header>

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

      {!loaded ? (
        <p className={styles.banner}>…</p>
      ) : (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void onSave();
          }}
        >
          <div className={styles.grid}>
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>{t("PRODUCT.DEFINITION")}</h2>
              <div className={styles.body}>
                <label className={styles.check}>
                  <input
                    type="checkbox"
                    checked={form.visible}
                    onChange={(event) =>
                      patchForm({ visible: event.target.checked })
                    }
                  />
                  {t("CONTENT.VISIBLE")}
                </label>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="sku">
                    {t("PRODUCT.UNIQUE_ID")}{" "}
                    <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="sku"
                    className={styles.input}
                    value={form.sku}
                    onChange={(event) => void onSkuChange(event.target.value)}
                  />
                  {skuError ? <p className={styles.error}>{skuError}</p> : null}
                  {!skuUnique ? (
                    <p className={styles.error}>{t("COMMON.SKU_EXISTS")}</p>
                  ) : null}
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="dateAvailable">
                    {t("PRODUCT.DATE_AVAILABLE")}
                  </label>
                  <input
                    id="dateAvailable"
                    type="date"
                    className={styles.input}
                    value={form.dateAvailable}
                    onChange={(event) =>
                      patchForm({ dateAvailable: event.target.value })
                    }
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="sortOrder">
                    {t("COMMON.ORDER")}
                  </label>
                  <input
                    id="sortOrder"
                    className={styles.input}
                    value={form.sortOrder}
                    onChange={(event) =>
                      patchForm({ sortOrder: event.target.value })
                    }
                  />
                  {submitted &&
                  (!form.sortOrder ||
                    !NUMBER_PATTERN.test(form.sortOrder)) ? (
                    <p className={styles.error}>
                      {t("COMMON.ORDER")} {t("COMMON.IS_REQUIRED")}
                    </p>
                  ) : null}
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="manufacturer">
                    {t("PRODUCT.MANUFACTURER")}{" "}
                    <span className={styles.required}>*</span>
                  </label>
                  <select
                    id="manufacturer"
                    className={styles.select}
                    value={form.manufacturer}
                    onChange={(event) =>
                      patchForm({ manufacturer: event.target.value })
                    }
                  >
                    <option value="">{t("PRODUCT.MANUFACTURER")}</option>
                    {manufacturers.map((code) => (
                      <option key={code} value={code}>
                        {code}
                      </option>
                    ))}
                  </select>
                  {submitted && !form.manufacturer ? (
                    <p className={styles.error}>
                      {t("PRODUCT.MANUFACTURER")} {t("COMMON.IS_REQUIRED")}
                    </p>
                  ) : null}
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="type">
                    {t("PRODUCT.PRODUCT_TYPE")}
                  </label>
                  <select
                    id="type"
                    className={styles.select}
                    value={form.type}
                    onChange={(event) => patchForm({ type: event.target.value })}
                  >
                    <option value="">{t("PRODUCT.PRODUCT_TYPE")}</option>
                    {productTypes.map((code) => (
                      <option key={code} value={code}>
                        {code}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            <section className={styles.card}>
              <h2 className={styles.cardTitle}>
                <span>{t("COMMON.SEO_DETAILS")}</span>
                <select
                  className={styles.select}
                  aria-label={t("COMMON.LANGUAGE")}
                  value={form.selectedLanguage}
                  onChange={(event) =>
                    patchForm({ selectedLanguage: event.target.value })
                  }
                >
                  {form.descriptions.map((description) => (
                    <option
                      key={description.language}
                      value={description.language}
                    >
                      {t(`LANG.${description.language}`)}
                    </option>
                  ))}
                </select>
              </h2>
              <div className={styles.body}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="name">
                    {t("DESCRIPTION_FORM.NAME")} -{" "}
                    {t(`LANG.${form.selectedLanguage}`)}{" "}
                    <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="name"
                    className={styles.input}
                    value={current?.name ?? ""}
                    onChange={(event) => onNameChange(event.target.value)}
                  />
                  {submitted && !current?.name ? (
                    <p className={styles.error}>
                      {t("DESCRIPTION_FORM.NAME_REQUIRED")} -{" "}
                      {t(`LANG.${form.selectedLanguage}`)}
                    </p>
                  ) : null}
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="title">
                    {t("DESCRIPTION_FORM.TITLE")} -{" "}
                    {t(`LANG.${form.selectedLanguage}`)}
                  </label>
                  <input
                    id="title"
                    className={styles.input}
                    value={current?.title ?? ""}
                    onChange={(event) =>
                      current &&
                      patchDescription(current.language, {
                        title: event.target.value,
                      })
                    }
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="highlights">
                    {t("DESCRIPTION_FORM.HIGHLIGHT")} -{" "}
                    {t(`LANG.${form.selectedLanguage}`)}
                  </label>
                  <input
                    id="highlights"
                    className={styles.input}
                    value={current?.highlights ?? ""}
                    onChange={(event) =>
                      current &&
                      patchDescription(current.language, {
                        highlights: event.target.value,
                      })
                    }
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="friendlyUrl">
                    {t("DESCRIPTION_FORM.FRIENDLY_URL")} -{" "}
                    {t(`LANG.${form.selectedLanguage}`)}{" "}
                    <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="friendlyUrl"
                    className={styles.input}
                    value={current?.friendlyUrl ?? ""}
                    onChange={(event) =>
                      current &&
                      patchDescription(current.language, {
                        friendlyUrl: event.target.value,
                      })
                    }
                  />
                  {submitted && !current?.friendlyUrl ? (
                    <p className={styles.error}>
                      {t("DESCRIPTION_FORM.FRIENDLY_URL_REQUIRED")}
                    </p>
                  ) : null}
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="keyWords">
                    {t("DESCRIPTION_FORM.KEYWORDS")} -{" "}
                    {t(`LANG.${form.selectedLanguage}`)}
                  </label>
                  <input
                    id="keyWords"
                    className={styles.input}
                    value={current?.keyWords ?? ""}
                    onChange={(event) =>
                      current &&
                      patchDescription(current.language, {
                        keyWords: event.target.value,
                      })
                    }
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="metaDescription">
                    {t("DESCRIPTION_FORM.META_DESCRIPTION")} -{" "}
                    {t(`LANG.${form.selectedLanguage}`)}
                  </label>
                  <input
                    id="metaDescription"
                    className={styles.input}
                    value={current?.metaDescription ?? ""}
                    onChange={(event) =>
                      current &&
                      patchDescription(current.language, {
                        metaDescription: event.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </section>

            <section className={`${styles.card} ${styles.wide}`}>
              <h2 className={styles.cardTitle}>
                {t("DESCRIPTION_FORM.DESCRIPTION")} -{" "}
                {t(`LANG.${form.selectedLanguage}`)}
              </h2>
              <div className={styles.body}>
                <textarea
                  id="description"
                  className={styles.textarea}
                  value={current?.description ?? ""}
                  onChange={(event) =>
                    current &&
                    patchDescription(current.language, {
                      description: event.target.value,
                    })
                  }
                />
              </div>
            </section>

            <section className={styles.card}>
              <h2 className={styles.cardTitle}>{t("Specifications")}</h2>
              <div className={styles.body}>
                {(
                  [
                    ["width", "COMMON.WIDTH"],
                    ["height", "COMMON.HEIGHT"],
                    ["length", "COMMON.LENGTH"],
                    ["weight", "COMMON.WEIGHT"],
                  ] as const
                ).map(([key, label]) => (
                  <div className={styles.field} key={key}>
                    <label className={styles.label} htmlFor={key}>
                      {t(label)}
                    </label>
                    <input
                      id={key}
                      type="number"
                      className={styles.input}
                      value={form.productSpecifications[key]}
                      onChange={(event) =>
                        patchForm({
                          productSpecifications: {
                            ...form.productSpecifications,
                            [key]: event.target.value,
                          },
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            </section>

            <section className={styles.card}>
              <h2 className={styles.cardTitle}>{t("COMPONENTS.INVENTORY")}</h2>
              <div className={styles.body}>
                <label className={styles.check}>
                  <input
                    type="checkbox"
                    checked={form.canBePurchased}
                    onChange={(event) =>
                      patchForm({ canBePurchased: event.target.checked })
                    }
                  />
                  {t("Available for purchase")}
                </label>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="price">
                    {t("PRICE.FINAL_PRICE")}{" "}
                    <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="price"
                    type="number"
                    className={styles.input}
                    value={form.price}
                    onChange={(event) =>
                      patchForm({ price: event.target.value })
                    }
                  />
                  {submitted && !form.price ? (
                    <p className={styles.error}>
                      {t("PRODUCT.PRICE")} {t("COMMON.IS_REQUIRED")}
                    </p>
                  ) : null}
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="quantity">
                    {t("Quantity")}
                    <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="quantity"
                    type="number"
                    className={styles.input}
                    value={form.quantity}
                    onChange={(event) =>
                      patchForm({ quantity: event.target.value })
                    }
                  />
                  {submitted &&
                  (!form.quantity || !NUMBER_PATTERN.test(form.quantity)) ? (
                    <p className={styles.error}>
                      {t("PRODUCT.QUANTITY")} {t("COMMON.IS_REQUIRED")}
                    </p>
                  ) : null}
                </div>
              </div>
            </section>
          </div>

          <div className={styles.footer}>
            <button type="submit" className={styles.primary} disabled={loading}>
              {loading
                ? ""
                : `${t("COMMON.SAVE")} ${t("PRODUCT.DEFINITION")}`}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
