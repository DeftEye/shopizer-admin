"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Pagination } from "@/components/catalogue/pagination";
import styles from "@/components/catalogue/catalogue-page.module.css";
import { useI18n } from "@/components/i18n-provider";
import { PRODUCTS_PER_PAGE } from "@/lib/catalogue/constants";
import { productListName } from "@/lib/catalogue/product-payload";
import {
  deleteProduct,
  listProducts,
  listStores,
  readApiErrorMessage,
  updateProductFromTable,
} from "@/lib/catalogue/products-api";
import type { ProductListItem } from "@/lib/catalogue/types";
import { getLang, getMerchant } from "@/lib/auth/session";

type ListParams = {
  store: string;
  lang: string;
  count: number;
  page: number;
  sku?: string;
  name?: string;
};

function loadParams(): ListParams {
  return {
    store: getMerchant() ?? "",
    lang: getLang(),
    count: PRODUCTS_PER_PAGE,
    page: 0,
  };
}

export default function ProductsListPage() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const [params, setParams] = useState<ListParams>(loadParams);
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [stores, setStores] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [skuFilter, setSkuFilter] = useState("");
  const [nameFilter, setNameFilter] = useState("");
  const [banner, setBanner] = useState<{ kind: "error" | "success"; text: string } | null>(
    null,
  );

  const currentPage = params.page + 1;

  const fetchList = useCallback(async (next: ListParams) => {
    setLoading(true);
    try {
      const result = await listProducts(next);
      setProducts(result.products ?? []);
      setTotal(result.recordsTotal ?? 0);
    } catch (error) {
      setBanner({
        kind: "error",
        text: readApiErrorMessage(error, t("COMMON.INTERNAL_SERVER_ERROR")),
      });
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    listStores()
      .then((result) => {
        setStores(
          (result.data ?? [])
            .map((store) => store.code)
            .filter((code): code is string => !!code),
        );
      })
      .catch(() => {
        setStores([]);
      });
  }, []);

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
        const sku = skuFilter.trim() || undefined;
        const name = nameFilter.trim() || undefined;
        if (prev.sku === sku && prev.name === name) {
          return prev;
        }
        return { ...prev, sku, name, page: 0 };
      });
    }, 300);
    return () => window.clearTimeout(id);
  }, [skuFilter, nameFilter]);

  function choseStore(store: string) {
    setParams((prev) => ({ ...prev, store, page: 0 }));
  }

  function changePage(page: number) {
    setParams((prev) => ({ ...prev, page: page - 1 }));
  }

  async function onAvailable(item: ProductListItem) {
    const available = !item.available;
    try {
      await updateProductFromTable(item.id, {
        available,
        price: item.price,
        quantity: item.quantity,
      });
      setProducts((prev) =>
        prev.map((row) => (row.id === item.id ? { ...row, available } : row)),
      );
      setBanner({ kind: "success", text: t("PRODUCT.PRODUCT_UPDATED") });
    } catch (error) {
      setBanner({
        kind: "error",
        text: readApiErrorMessage(error, t("COMMON.INTERNAL_SERVER_ERROR")),
      });
    }
  }

  async function onRemove(item: ProductListItem) {
    if (!window.confirm(t("COMMON.REMOVE_QUESTION"))) {
      return;
    }
    try {
      await deleteProduct(item.id);
      setBanner({ kind: "success", text: t("PRODUCT.PRODUCT_REMOVED") });
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
        <h1 className={styles.title}>{t("COMPONENTS.PRODUCTS")}</h1>
        <div className={styles.toolbar}>
          <select
            className={styles.select}
            aria-label={t("ORDER_FORM.SELECT_STORE")}
            value={params.store}
            onChange={(event) => choseStore(event.target.value)}
          >
            {params.store && !stores.includes(params.store) ? (
              <option value={params.store}>{params.store}</option>
            ) : null}
            {stores.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
          <Link
            className={styles.createLink}
            href="/pages/catalogue/products/create-product"
          >
            {t("COMPONENTS.CREATE_PRODUCT")}
          </Link>
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

        <div className={styles.filters}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="filter-sku">
              {t("PRODUCT.SKU")}
            </label>
            <input
              id="filter-sku"
              className={styles.input}
              value={skuFilter}
              onChange={(event) => setSkuFilter(event.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="filter-name">
              {t("PRODUCT.PRODUCT_NAME")}
            </label>
            <input
              id="filter-name"
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
                <th>{t("PRODUCT.SKU")}</th>
                <th>{t("PRODUCT.PRODUCT_NAME")}</th>
                <th>{t("PRODUCT.QTY")}</th>
                <th>{t("COMMON.AVAILABLE")}</th>
                <th>{t("PRODUCT.PRICE")}</th>
                <th>{t("PRODUCT.CREATION_DATE")}</th>
                <th>{t("ORDER.ACTIONS")}</th>
              </tr>
            </thead>
            <tbody>
              {products.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.sku}</td>
                  <td>{productListName(item)}</td>
                  <td>{item.quantity}</td>
                  <td>
                    <input
                      type="checkbox"
                      checked={!!item.available}
                      aria-label={`${t("COMMON.AVAILABLE")} ${item.sku}`}
                      onChange={() => void onAvailable(item)}
                    />
                  </td>
                  <td>{item.price}</td>
                  <td>{item.creationDate}</td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        type="button"
                        className={styles.linkButton}
                        onClick={() =>
                          router.push(
                            `/pages/catalogue/products/product/${item.id}`,
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
        ) : products.length === 0 ? (
          <p className={styles.empty}>{t("COMMON.NO_ITEMS")}</p>
        ) : null}

        <Pagination
          currentPage={currentPage}
          perPage={params.count}
          count={total}
          onPage={changePage}
        />
      </section>
    </div>
  );
}
