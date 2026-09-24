"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { CategoryPagination } from "@/components/category-pagination";
import styles from "@/components/category-page.module.css";
import { useI18n } from "@/components/i18n-provider";
import {
  deleteCategory,
  listCategories,
  readApiErrorMessage,
  updateCategoryVisibility,
} from "@/lib/api/categories";
import { getLang, getMerchant } from "@/lib/auth/session";
import { flattenCategoryTree } from "@/lib/categories/category-form";
import { CATEGORIES_PER_PAGE } from "@/lib/categories/constants";
import type { CategoryNode } from "@/lib/categories/types";

type ListParams = {
  store: string;
  lang: string;
  count: number;
  page: number;
  name?: string;
};

function loadParams(): ListParams {
  return {
    store: getMerchant() ?? "",
    lang: getLang(),
    count: CATEGORIES_PER_PAGE,
    page: 0,
  };
}

function parentCode(item: CategoryNode): string {
  return item.parent?.code || "root";
}

export default function CategoriesListPage() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const [params, setParams] = useState<ListParams>(loadParams);
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [nameFilter, setNameFilter] = useState("");
  const [banner, setBanner] = useState<{
    kind: "error" | "success";
    text: string;
  } | null>(null);

  const currentPage = params.page + 1;

  const fetchList = useCallback(
    async (next: ListParams) => {
      setLoading(true);
      try {
        const result = await listCategories(next);
        setCategories(flattenCategoryTree(result.categories ?? []));
        setTotal(result.recordsTotal ?? 0);
      } catch (error) {
        setBanner({
          kind: "error",
          text: readApiErrorMessage(error, t("COMMON.INTERNAL_SERVER_ERROR")),
        });
      } finally {
        setLoading(false);
      }
    },
    [t],
  );

  useEffect(() => {
    const id = window.setTimeout(() => {
      void fetchList(params);
    }, 0);
    return () => window.clearTimeout(id);
  }, [fetchList, params]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setParams((prev) =>
        prev.lang === lang ? prev : { ...prev, lang, page: 0 },
      );
    }, 0);
    return () => window.clearTimeout(id);
  }, [lang]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setParams((prev) => {
        const name = nameFilter.trim() || undefined;
        if (prev.name === name) {
          return prev;
        }
        return { ...prev, name, page: 0 };
      });
    }, 300);
    return () => window.clearTimeout(id);
  }, [nameFilter]);

  async function onVisible(item: CategoryNode) {
    const visible = !item.visible;
    const next = { ...item, visible };
    try {
      await updateCategoryVisibility(next);
      setCategories((prev) =>
        prev.map((row) => (row.id === item.id ? next : row)),
      );
      setBanner({ kind: "success", text: t("CATEGORY.CATEGORY_VISIBILITY") });
    } catch (error) {
      setBanner({
        kind: "error",
        text: readApiErrorMessage(error, t("COMMON.INTERNAL_SERVER_ERROR")),
      });
    }
  }

  async function onRemove(item: CategoryNode) {
    if (!window.confirm(t("COMMON.REMOVE_QUESTION"))) {
      return;
    }
    try {
      await deleteCategory(item.id);
      setBanner({ kind: "success", text: t("CATEGORY_FORM.CATEGORY_REMOVED") });
      void fetchList(params);
    } catch (error) {
      setBanner({
        kind: "error",
        text: readApiErrorMessage(error, t("COMMON.INTERNAL_SERVER_ERROR")),
      });
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t("COMPONENTS.CATEGORIES")}</h1>
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

        <div className={styles.filters}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="filter-category-name">
              {t("CATEGORY.CATEGORY_NAME")}
            </label>
            <input
              id="filter-category-name"
              className={styles.input}
              value={nameFilter}
              onChange={(event) => setNameFilter(event.target.value)}
            />
          </div>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{t("COMMON.ID")}</th>
                <th>{t("STORE.MERCHANT_STORE")}</th>
                <th>{t("CATEGORY.CATEGORY_NAME")}</th>
                <th>{t("COMMON.CODE")}</th>
                <th>{t("CATEGORY.PARENT")}</th>
                <th>{t("COMMON.VISIBLE")}</th>
                <th>{t("ORDER.ACTIONS")}</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.store}</td>
                  <td>{item.name}</td>
                  <td>{item.code}</td>
                  <td>{parentCode(item)}</td>
                  <td>
                    <input
                      type="checkbox"
                      checked={!!item.visible}
                      aria-label={`${t("COMMON.VISIBLE")} ${item.code}`}
                      onChange={() => void onVisible(item)}
                    />
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        type="button"
                        className={styles.linkButton}
                        onClick={() =>
                          router.push(
                            `/pages/catalogue/categories/category/${item.id}`,
                          )
                        }
                      >
                        {t("COMMON.EDIT")}
                      </button>
                      <button
                        type="button"
                        className={styles.dangerButton}
                        onClick={() => void onRemove(item)}
                      >
                        {t("COMMON.REMOVE")}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {loading ? (
          <p className={styles.status}>…</p>
        ) : categories.length === 0 ? (
          <p className={styles.empty}>{t("COMMON.NO_ITEMS")}</p>
        ) : null}

        <CategoryPagination
          currentPage={currentPage}
          perPage={params.count}
          count={total}
          onPage={(page) => setParams((prev) => ({ ...prev, page: page - 1 }))}
        />
      </section>
    </div>
  );
}
