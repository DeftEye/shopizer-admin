"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { useI18n } from "@/components/i18n-provider";
import {
  addCategory,
  checkCategoryCode,
  getStoreLanguages,
  listCategories,
  listStoreNames,
  normalizeStoreNames,
  readApiErrorMessage,
  updateCategory,
} from "@/lib/api/categories";
import {
  isRetailAdmin,
  isSuperAdmin,
} from "@/lib/auth/roles";
import { getLang, getMerchant, getRoles } from "@/lib/auth/session";
import {
  buildCategoryPayload,
  emptyCategoryForm,
  emptyDescription,
  formFromCategory,
  invalidCategoryControls,
  parentOptions,
} from "@/lib/categories/category-form";
import { CATEGORY_PARENT_COUNT } from "@/lib/categories/constants";
import { slugify } from "@/lib/categories/slugify";
import type {
  CategoryDescription,
  CategoryDetail,
  CategoryFormState,
  CategoryNode,
} from "@/lib/categories/types";

import styles from "./category-form.module.css";

export function CategoryForm({ category }: { category: Partial<CategoryDetail> }) {
  const { t } = useI18n();
  const router = useRouter();
  const [superAdmin, setSuperAdmin] = useState(false);
  const [showStore, setShowStore] = useState(false);
  const [form, setForm] = useState<CategoryFormState>(() =>
    emptyCategoryForm("en", ""),
  );
  const [roots, setRoots] = useState<CategoryNode[]>([]);
  const [stores, setStores] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [codeUnique, setCodeUnique] = useState(true);
  const [banner, setBanner] = useState<{
    kind: "error" | "success";
    text: string;
  } | null>(null);

  useEffect(() => {
    const store = getMerchant() ?? "";
    const lang = getLang();
    const roles = getRoles();
    let cancelled = false;

    Promise.all([
      listStoreNames(),
      getStoreLanguages(store),
      listCategories({
        store,
        lang,
        count: CATEGORY_PARENT_COUNT,
        page: 0,
      }),
    ])
      .then(([storeRes, languages, categories]) => {
        if (cancelled) {
          return;
        }
        setSuperAdmin(isSuperAdmin(roles));
        setShowStore(isSuperAdmin(roles) || isRetailAdmin(roles));
        const langs = Array.isArray(languages) ? languages : [];
        setStores(normalizeStoreNames(storeRes));
        setRoots(
          parentOptions(categories.categories ?? [], category.id),
        );
        const next = category.id
          ? formFromCategory(category as CategoryDetail, langs, lang, store)
          : {
              ...emptyCategoryForm(lang, store),
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
  }, [category, category.id, t]);

  const current = useMemo(
    () =>
      form.descriptions.find(
        (description) => description.language === form.selectedLanguage,
      ),
    [form.descriptions, form.selectedLanguage],
  );

  const missing = invalidCategoryControls(form);
  const canSave = loaded && missing.length === 0 && codeUnique && !loading;

  function patchForm(partial: Partial<CategoryFormState>) {
    setForm((prev) => ({ ...prev, ...partial }));
  }

  function patchDescription(
    language: string,
    partial: Partial<CategoryDescription>,
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

  async function onCodeChange(value: string) {
    patchForm({ code: value });
    if (!value) {
      setCodeUnique(true);
      return;
    }
    try {
      const result = await checkCategoryCode(value);
      setCodeUnique(!(result.exists && category.code !== value));
    } catch {
      setCodeUnique(true);
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

  async function save() {
    setSubmitted(true);
    setLoading(true);
    const merchant = getMerchant() ?? "";
    const { payload, requiredMissing, missing: errors } = buildCategoryPayload(
      form,
      roots,
      merchant,
      superAdmin,
    );

    if (requiredMissing || errors.length > 0) {
      setBanner({ kind: "error", text: t("COMMON.FILL_REQUIRED_FIELDS") });
      setLoading(false);
      return;
    }
    if (!codeUnique) {
      setBanner({ kind: "error", text: t("COMMON.CODE_EXISTS") });
      setLoading(false);
      return;
    }

    try {
      if (category.id) {
        await updateCategory(category.id, payload);
        setBanner({
          kind: "success",
          text: t("CATEGORY_FORM.CATEGORY_UPDATED"),
        });
      } else {
        await addCategory(payload);
        setBanner({
          kind: "success",
          text: t("CATEGORY_FORM.CATEGORY_CREATED"),
        });
        router.push("/pages/catalogue/categories/categories-list");
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

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t("COMPONENTS.CATEGORY")}</h1>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.cancel}
            onClick={() =>
              router.push("/pages/catalogue/categories/categories-list")
            }
          >
            {t("ORDER_FORM.CANCLE")}
          </button>
          <button
            type="button"
            className={styles.primary}
            disabled={!canSave}
            onClick={() => void save()}
          >
            {t("COMMON.SAVE")}
          </button>
        </div>
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

      {!loaded ? <p className={styles.error}>…</p> : null}

      {loaded ? (
        <form
          className={styles.grid}
          onSubmit={(event) => {
            event.preventDefault();
            void save();
          }}
        >
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>{t("CONTENT.BASIC_DETAILS")}</h2>
            <div className={styles.body}>
              <label className={styles.check}>
                <input
                  type="checkbox"
                  checked={form.visible}
                  onChange={(event) =>
                    patchForm({ visible: event.target.checked })
                  }
                />
                {t("COMMON.VISIBLE")}
              </label>

              {showStore ? (
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="category-store">
                    {t("STORE.MERCHANT_STORE")}
                  </label>
                  <select
                    id="category-store"
                    className={styles.select}
                    value={form.store}
                    disabled={!superAdmin}
                    onChange={(event) => patchForm({ store: event.target.value })}
                  >
                    {form.store && !stores.includes(form.store) ? (
                      <option value={form.store}>{form.store}</option>
                    ) : null}
                    {stores.map((code) => (
                      <option key={code} value={code}>
                        {code}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              <div className={styles.field}>
                <label className={styles.label} htmlFor="category-parent">
                  {t("CATEGORY.PARENT")}
                </label>
                <select
                  id="category-parent"
                  className={styles.select}
                  value={form.parent}
                  onChange={(event) => patchForm({ parent: event.target.value })}
                >
                  {roots.map((item) => (
                    <option key={`${item.id}-${item.code}`} value={item.code}>
                      {item.code}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="category-code">
                  {t("COMMON.CODE")} <span className={styles.required}>*</span>
                </label>
                <input
                  id="category-code"
                  className={styles.input}
                  value={form.code}
                  readOnly={!!category.id}
                  onChange={(event) => void onCodeChange(event.target.value)}
                />
                {submitted && missing.includes("code") ? (
                  <p className={styles.error}>
                    {form.code
                      ? t("COMMON.ALPHA_DECIMAL_RULE")
                      : t("COMMON.CODE_REQUIRED")}
                  </p>
                ) : null}
                {!codeUnique ? (
                  <p className={styles.error}>{t("COMMON.CODE_EXISTS")}</p>
                ) : null}
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="category-order">
                  {t("COMMON.ORDER")}
                </label>
                <input
                  id="category-order"
                  className={styles.input}
                  value={form.sortOrder}
                  onChange={(event) =>
                    patchForm({ sortOrder: event.target.value })
                  }
                />
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
                  <option key={description.language} value={description.language}>
                    {t(`LANG.${description.language}`)}
                  </option>
                ))}
              </select>
            </h2>
            <div className={styles.body}>
              {current ? (
                <>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="category-title">
                      {t("DESCRIPTION_FORM.TITLE")}
                    </label>
                    <input
                      id="category-title"
                      className={styles.input}
                      value={current.title}
                      onChange={(event) =>
                        patchDescription(current.language, {
                          title: event.target.value,
                        })
                      }
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="category-name">
                      {t("DESCRIPTION_FORM.NAME")}{" "}
                      <span className={styles.required}>*</span>
                    </label>
                    <input
                      id="category-name"
                      className={styles.input}
                      value={current.name}
                      onChange={(event) => onNameChange(event.target.value)}
                    />
                    {submitted && !current.name ? (
                      <p className={styles.error}>
                        {t("DESCRIPTION_FORM.NAME_REQUIRED")}
                      </p>
                    ) : null}
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="category-url">
                      {t("DESCRIPTION_FORM.FRIENDLY_URL")}{" "}
                      <span className={styles.required}>*</span>
                    </label>
                    <input
                      id="category-url"
                      className={styles.input}
                      value={current.friendlyUrl}
                      onChange={(event) =>
                        patchDescription(current.language, {
                          friendlyUrl: event.target.value,
                        })
                      }
                    />
                    {submitted && !current.friendlyUrl ? (
                      <p className={styles.error}>
                        {t("DESCRIPTION_FORM.FRIENDLY_URL_REQUIRED")}
                      </p>
                    ) : null}
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="category-highlight">
                      {t("DESCRIPTION_FORM.HIGHLIGHT")}
                    </label>
                    <input
                      id="category-highlight"
                      className={styles.input}
                      value={current.highlights}
                      onChange={(event) =>
                        patchDescription(current.language, {
                          highlights: event.target.value,
                        })
                      }
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="category-meta">
                      {t("DESCRIPTION_FORM.META_DESCRIPTION")}
                    </label>
                    <input
                      id="category-meta"
                      className={styles.input}
                      value={current.metaDescription}
                      onChange={(event) =>
                        patchDescription(current.language, {
                          metaDescription: event.target.value,
                        })
                      }
                    />
                  </div>
                </>
              ) : null}
            </div>
          </section>

          <section className={`${styles.card} ${styles.wide}`}>
            <h2 className={styles.cardTitle}>
              {t("DESCRIPTION_FORM.DESCRIPTION")}
            </h2>
            <div className={styles.body}>
              {current ? (
                <textarea
                  id="category-description"
                  className={styles.textarea}
                  aria-label={t("DESCRIPTION_FORM.DESCRIPTION")}
                  value={current.description}
                  onChange={(event) =>
                    patchDescription(current.language, {
                      description: event.target.value,
                    })
                  }
                />
              ) : null}
            </div>
          </section>
        </form>
      ) : null}
    </div>
  );
}
