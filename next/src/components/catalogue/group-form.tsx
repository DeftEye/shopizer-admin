"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { CatalogueGate } from "@/components/catalogue-gate";
import { useI18n } from "@/components/i18n-provider";
import { getListOfProducts } from "@/lib/api/catalog";
import {
  addProductToGroup,
  createProductGroup,
  getListOfProductGroups,
  getProductsByGroup,
  removeProductFromGroup,
  updateGroupActiveValue,
} from "@/lib/api/product-groups";
import type { CatalogProduct } from "@/lib/api/types";
import { getLang, getMerchant } from "@/lib/auth/session";
import { ALPHANUMERIC_WITH_HYPHEN_PATTERN } from "@/lib/constants";

import styles from "../catalog.module.css";

type PickItem = { id: number; name: string };

export function GroupForm({ groupCode }: { groupCode?: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const [code, setCode] = useState(groupCode ?? "");
  const [active, setActive] = useState(true);
  const [products, setProducts] = useState<PickItem[]>([]);
  const [selected, setSelected] = useState<PickItem[]>([]);
  const [query, setQuery] = useState("");
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!groupCode) {
      return;
    }
    const code = groupCode;
    let cancelled = false;
    async function load() {
      const store = getMerchant() ?? "";
      const lang = getLang();
      try {
        const [groups, grouped, available] = await Promise.all([
          getListOfProductGroups(store),
          getProductsByGroup(code, { store, lang }),
          getListOfProducts({ store, lang, count: 50, page: 0 }),
        ]);
        if (cancelled) {
          return;
        }
        const current = groups.find((group) => group.code === groupCode);
        if (current) {
          setCode(current.code);
          setActive(!!current.active);
        }
        setSelected(
          (grouped.products ?? []).map((item) => ({
            id: item.id,
            name: item.description?.name ?? String(item.id),
          })),
        );
        setProducts(
          (available.products ?? []).map((item: CatalogProduct) => ({
            id: item.id,
            name: item.description?.name ?? String(item.id),
          })),
        );
      } catch {
        if (!cancelled) {
          setError(t("COMMON.INTERNAL_SERVER_ERROR"));
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [groupCode, t]);

  async function onFilter(name: string) {
    setQuery(name);
    if (name.length > 3 || name === "") {
      try {
        const res = await getListOfProducts({
          store: getMerchant() ?? "",
          lang: getLang(),
          count: 50,
          page: 0,
          name: name || undefined,
        });
        setProducts(
          (res.products ?? []).map((item) => ({
            id: item.id,
            name: item.description?.name ?? String(item.id),
          })),
        );
      } catch {
        setError(t("COMMON.INTERNAL_SERVER_ERROR"));
      }
    }
  }

  const options = useMemo(() => {
    const map = new Map<number, PickItem>();
    for (const item of [...products, ...selected]) {
      map.set(item.id, item);
    }
    return Array.from(map.values());
  }, [products, selected]);

  async function toggleProduct(item: PickItem, checked: boolean) {
    if (!groupCode) {
      return;
    }
    setSaving(true);
    try {
      if (checked) {
        await addProductToGroup(item.id, groupCode);
        setSelected((current) =>
          current.some((entry) => entry.id === item.id)
            ? current
            : [...current, item],
        );
      } else {
        await removeProductFromGroup(item.id, groupCode);
        setSelected((current) => current.filter((entry) => entry.id !== item.id));
      }
    } catch {
      setError(t("COMMON.INTERNAL_SERVER_ERROR"));
    } finally {
      setSaving(false);
    }
  }

  async function save() {
    setTouched(true);
    setError("");
    if (!code || !ALPHANUMERIC_WITH_HYPHEN_PATTERN.test(code)) {
      return;
    }
    setSaving(true);
    try {
      if (groupCode) {
        await updateGroupActiveValue({ code, active });
      } else {
        await createProductGroup({ code, active, product: [] });
      }
      router.push("/pages/catalogue/products-groups/groups-list");
    } catch {
      setError(t("COMMON.INTERNAL_SERVER_ERROR"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <CatalogueGate>
      <div className={styles.page}>
        <header className={styles.header}>
          <h1 className={styles.title}>{t("PRODUCT_GROUP.CREATE_PRODUCT_GROUP")}</h1>
          <button
            type="button"
            className={styles.secondary}
            onClick={() =>
              router.push("/pages/catalogue/products-groups/groups-list")
            }
          >
            {t("ORDER_FORM.CANCLE")}
          </button>
          <button
            type="button"
            className={styles.primary}
            onClick={() => void save()}
            disabled={saving}
          >
            {groupCode ? t("COMMON.UPDATE") : t("COMMON.SAVE")}
          </button>
        </header>
        <section className={styles.card}>
          {error ? (
            <p className={`${styles.banner} ${styles.bannerError}`} role="alert">
              {error}
            </p>
          ) : null}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void save();
            }}
          >
            <div className={styles.checks}>
              <label className={styles.check}>
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(event) => setActive(event.target.checked)}
                />
                {t("COMMON.VISIBLE")}
              </label>
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="group-code">
                {t("COMMON.CODE")} *
              </label>
              <input
                id="group-code"
                className={styles.input}
                value={code}
                readOnly={!!groupCode}
                required
                onChange={(event) => {
                  setTouched(true);
                  setCode(event.target.value);
                }}
              />
              {touched && !code ? (
                <p className={styles.error}>{t("COMMON.CODE_REQUIRED")}</p>
              ) : null}
              {touched && code && !ALPHANUMERIC_WITH_HYPHEN_PATTERN.test(code) ? (
                <p className={styles.error}>{t("COMMON.ALPHA_DECIMAL_RULE")}</p>
              ) : null}
            </div>
            {groupCode && options.length > 0 ? (
              <div className={styles.field}>
                <label className={styles.label} htmlFor="group-products">
                  {t("PRODUCT.SELECT")}
                </label>
                <div className={styles.productPick}>
                  <input
                    id="group-products"
                    className={styles.search}
                    value={query}
                    placeholder={t("COMMON.SEARCH")}
                    onChange={(event) => void onFilter(event.target.value)}
                  />
                  <div className={styles.productList}>
                    {options.map((item) => (
                      <label key={item.id} className={styles.check}>
                        <input
                          type="checkbox"
                          checked={selected.some((entry) => entry.id === item.id)}
                          onChange={(event) =>
                            void toggleProduct(item, event.target.checked)
                          }
                        />
                        {item.name}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </form>
        </section>
      </div>
    </CatalogueGate>
  );
}
