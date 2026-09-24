"use client";

import { useEffect, useMemo, useState } from "react";

import styles from "@/components/catalogue/catalogue-page.module.css";
import { useI18n } from "@/components/i18n-provider";
import { moveItemInArray } from "@/lib/catalogue/pagination";
import { productListName } from "@/lib/catalogue/product-payload";
import {
  getProductsByCategory,
  getProductsByOrder,
  listCategories,
  readApiErrorMessage,
} from "@/lib/catalogue/products-api";
import type { OrderProduct } from "@/lib/catalogue/types";
import { getLang } from "@/lib/auth/session";

type CategoryOption = {
  id: number;
  code: string;
  name: string;
};

function toOrderProducts(
  products: Array<{
    id?: number;
    name?: string;
    sku?: string;
    quantity?: number | string;
    price?: string | number;
    creationDate?: string;
    description?: { name?: string };
  }>,
): OrderProduct[] {
  return products
    .filter((item): item is typeof item & { id: number; sku: string } => {
      return typeof item.id === "number" && !!item.sku;
    })
    .map((item) => ({
      id: item.id,
      sku: item.sku,
      name: productListName(item),
      quantity: item.quantity,
      price: item.price,
      creationDate: item.creationDate,
    }));
}

export default function ProductOrderingPage() {
  const { t, lang } = useI18n();
  const [data, setData] = useState<OrderProduct[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dragFrom, setDragFrom] = useState<number | null>(null);

  const suggestions = useMemo(() => {
    const query = category.trim().toLowerCase();
    if (!query) {
      return categories;
    }
    return categories.filter(
      (item) =>
        item.code.toLowerCase().includes(query) ||
        item.name.toLowerCase().includes(query),
    );
  }, [categories, category]);

  async function loadAll() {
    setLoading(true);
    try {
      const result = await getProductsByOrder();
      setData(toOrderProducts(result.products ?? []));
      setError("");
    } catch (err) {
      setError(readApiErrorMessage(err, t("COMMON.INTERNAL_SERVER_ERROR")));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    const id = window.setTimeout(() => {
      setLoading(true);
    }, 0);
    Promise.all([getProductsByOrder(), listCategories(getLang())])
      .then(([products, categoryRes]) => {
        if (cancelled) {
          return;
        }
        setData(toOrderProducts(products.products ?? []));
        setCategories(
          (categoryRes.categories ?? []).map((item) => ({
            id: item.id,
            code: item.code,
            name: (item.description?.name ?? item.code).toLowerCase(),
          })),
        );
        setError("");
      })
      .catch((err) => {
        if (!cancelled) {
          setError(readApiErrorMessage(err, t("COMMON.INTERNAL_SERVER_ERROR")));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [lang, t]);

  async function onSelectCategory(value: string) {
    setCategory(value);
    const match = categories.find(
      (item) => item.name === value.toLowerCase() || item.code === value,
    );
    if (!match) {
      if (!value) {
        void loadAll();
      }
      return;
    }
    setLoading(true);
    try {
      const result = await getProductsByCategory(match.id);
      setData(toOrderProducts(result.products ?? []));
      setError("");
    } catch (err) {
      setError(readApiErrorMessage(err, t("COMMON.INTERNAL_SERVER_ERROR")));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t("COMPONENTS.PRODUCT_ORDERING")}</h1>
      </header>
      <section className={styles.card}>
        <p className={styles.details}>
          {t("COMPONENTS.PRODUCT_ORDERING_DETAILS")}
        </p>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="category">
            {t("CATEGORY.CATEGORY_NAME")}
          </label>
          <input
            id="category"
            className={styles.input}
            list="product-order-categories"
            value={category}
            onChange={(event) => void onSelectCategory(event.target.value)}
          />
          <datalist id="product-order-categories">
            {suggestions.map((item) => (
              <option key={item.id} value={item.code}>
                {item.name}
              </option>
            ))}
          </datalist>
        </div>

        {error ? (
          <p className={`${styles.banner} ${styles.bannerError}`} role="alert">
            {error}
          </p>
        ) : null}

        <div className={styles.orderHeader}>
          <span>{t("COMMON.ID")}</span>
          <span>{t("PRODUCT.SKU")}</span>
          <span>{t("PRODUCT.PRODUCT_NAME")}</span>
          <span>{t("PRODUCT.QTY")}</span>
          <span>{t("PRODUCT.PRICE")}</span>
          <span>{t("PRODUCT.CREATION_DATE")}</span>
        </div>
        {loading ? <p className={styles.status}>…</p> : null}
        <ul className={styles.orderList}>
          {data.map((item, index) => (
            <li
              key={item.id}
              className={styles.orderItem}
              draggable
              onDragStart={() => setDragFrom(index)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                if (dragFrom == null) {
                  return;
                }
                setData((prev) => moveItemInArray(prev, dragFrom, index));
                setDragFrom(null);
              }}
            >
              <span>{item.id}</span>
              <span>{item.sku}</span>
              <span>{item.name}</span>
              <span>{item.quantity}</span>
              <span>{item.price}</span>
              <span>{item.creationDate}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
