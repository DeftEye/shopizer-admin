"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useI18n } from "@/components/i18n-provider";
import { Pagination } from "@/components/options/pagination";
import { StoreAutocomplete } from "@/components/options/store-autocomplete";
import styles from "@/components/options/options-page.module.css";
import { getLang, getMerchant } from "@/lib/auth/session";
import { deleteOptionValue, listOptionValues } from "@/lib/catalogue/options-api";
import {
  nameFromDescriptions,
  readApiErrorMessage,
} from "@/lib/catalogue/options-helpers";
import type {
  OptionsListParams,
  ProductOptionValue,
} from "@/lib/catalogue/options-types";
import { OPTIONS_PER_PAGE } from "@/lib/catalogue/options-types";

function loadParams(): OptionsListParams {
  return {
    store: getMerchant() ?? "",
    lang: getLang(),
    count: OPTIONS_PER_PAGE,
    page: 0,
  };
}

export default function OptionsValuesListPage() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const [params, setParams] = useState<OptionsListParams>(loadParams);
  const [optionValues, setOptionValues] = useState<ProductOptionValue[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [nameFilter, setNameFilter] = useState("");
  const [banner, setBanner] = useState<{ kind: "error" | "success"; text: string } | null>(
    null,
  );

  const currentPage = (params.page ?? 0) + 1;

  const fetchList = useCallback(
    async (next: OptionsListParams) => {
      setLoading(true);
      try {
        const result = await listOptionValues(next);
        setOptionValues(result.optionValues ?? []);
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

  const visible = useMemo(() => {
    const query = nameFilter.trim().toLowerCase();
    if (!query) {
      return optionValues;
    }
    return optionValues.filter((item) =>
      nameFromDescriptions(item.descriptions, params.lang ?? lang)
        .toLowerCase()
        .includes(query),
    );
  }, [lang, nameFilter, optionValues, params.lang]);

  async function onRemove(item: ProductOptionValue) {
    if (!item.id) {
      return;
    }
    if (!window.confirm(t("COMMON.REMOVE_GEN_QUESTION"))) {
      return;
    }
    try {
      await deleteOptionValue(item.id);
      setBanner({
        kind: "success",
        text: t("OPTION_VALUE.OPTION_VALUE_REMOVED"),
      });
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
        <h1 className={styles.title}>{t("COMPONENTS.OPTIONS_VALUES_LIST")}</h1>
        <div className={styles.toolbar}>
          <StoreAutocomplete
            value={params.store ?? ""}
            placeholder={t("STORE.MERCHANT_STORE")}
            onStore={(store) => setParams((prev) => ({ ...prev, store, page: 0 }))}
          />
          <Link
            className={styles.createLink}
            href="/pages/catalogue/options/create-option-value"
          >
            {t("COMPONENTS.CREATE_OPTION_VALUE")}
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

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{t("COMMON.ID")}</th>
                <th>{t("COMMON.CODE")}</th>
                <th>
                  {t("COMMON.NAME")}
                  <input
                    className={`${styles.input} ${styles.filterInput}`}
                    aria-label={t("COMMON.NAME")}
                    value={nameFilter}
                    onChange={(event) => setNameFilter(event.target.value)}
                  />
                </th>
                <th>{t("ORDER.ACTIONS")}</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.code}</td>
                  <td>
                    {nameFromDescriptions(item.descriptions, params.lang ?? lang)}
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        type="button"
                        className={styles.linkButton}
                        onClick={() =>
                          router.push(
                            `/pages/catalogue/options/option-value/${item.id}`,
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
        ) : visible.length === 0 ? (
          <p className={styles.empty}>{t("COMMON.NO_ITEMS")}</p>
        ) : null}

        <Pagination
          currentPage={currentPage}
          perPage={params.count ?? OPTIONS_PER_PAGE}
          count={total}
          ofLabel={t("COMMON.PAGINATOR_OF")}
          onPage={(page) => setParams((prev) => ({ ...prev, page: page - 1 }))}
        />
      </section>
    </div>
  );
}
