"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { useI18n } from "@/components/i18n-provider";
import styles from "@/components/options/options-page.module.css";
import { listVariations } from "@/lib/catalogue/options-api";
import { joinNames, readApiErrorMessage } from "@/lib/catalogue/options-helpers";
import type { Variation } from "@/lib/catalogue/options-types";

export default function VariationsListPage() {
  const { t } = useI18n();
  const [rows, setRows] = useState<Variation[]>([]);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState<{ kind: "error" | "success"; text: string } | null>(
    null,
  );

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listVariations();
      setRows(result.items ?? []);
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
    const id = window.setTimeout(() => {
      void fetchList();
    }, 0);
    return () => window.clearTimeout(id);
  }, [fetchList]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t("COMPONENTS.VARIATIONS_LIST")}</h1>
        <div className={styles.toolbar}>
          <Link
            className={styles.createLink}
            href="/pages/catalogue/options/variations/add"
          >
            {t("COMPONENTS.ADD_VARIATIONS")}
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
                <th>{t("PRODUCT_ATTRIBUTES.OPTION_NAME")}</th>
                <th>{t("COMPONENTS.OPTIONS_VALUE")}</th>
                <th>{t("ORDER.ACTIONS")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.code}</td>
                  <td>{item.option?.name ?? ""}</td>
                  <td>{joinNames(item.values)}</td>
                  <td>
                    <div className={styles.actions}>
                      <button type="button" className={styles.linkButton}>
                        {t("COMMON.EDIT")}
                      </button>
                      <button type="button" className={styles.dangerButton}>
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
        ) : rows.length === 0 ? (
          <p className={styles.empty}>{t("COMMON.NO_ITEMS")}</p>
        ) : null}
      </section>
    </div>
  );
}
