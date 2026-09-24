"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { CatalogueGate } from "@/components/catalogue-gate";
import styles from "@/components/catalog.module.css";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DataTable } from "@/components/data-table";
import { useI18n } from "@/components/i18n-provider";
import { Pagination } from "@/components/pagination";
import { StoreAutocomplete } from "@/components/store-autocomplete";
import { deleteBrand, getListOfBrands } from "@/lib/api/brands";
import type { Brand } from "@/lib/api/types";
import { getLang, getMerchant } from "@/lib/auth/session";
import { nextPage, type PageAction } from "@/lib/page";

const PER_PAGE = 25;

export default function BrandsListPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [rows, setRows] = useState<Brand[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [store, setStore] = useState(() => getMerchant() ?? "");
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<Brand | null>(null);
  const [message, setMessage] = useState("");

  const load = useCallback(
    async (page: number, merchant: string) => {
      setLoading(true);
      try {
        const res = await getListOfBrands({
          lang: getLang(),
          store: merchant,
          count: PER_PAGE,
          page: page - 1,
        });
        setRows(res.manufacturers ?? []);
        setTotal(res.recordsTotal ?? 0);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    const id = window.setTimeout(() => {
      void load(currentPage, store);
    }, 0);
    return () => window.clearTimeout(id);
  }, [currentPage, load, store]);

  function onPage(action: PageAction, data?: number) {
    setCurrentPage(nextPage(action, currentPage, data));
  }

  async function confirmRemove() {
    if (!pending?.id) {
      return;
    }
    await deleteBrand(pending.id);
    setPending(null);
    setMessage(t("BRAND.BRAND_REMOVED"));
    await load(currentPage, store);
  }

  return (
    <CatalogueGate>
      <div className={styles.page}>
        <header className={styles.header}>
          <h1 className={styles.title}>{t("COMPONENTS.BRANDS")}</h1>
        </header>
        <section className={styles.card}>
          {message ? (
            <p className={`${styles.banner} ${styles.bannerSuccess}`}>{message}</p>
          ) : null}
          <div className={styles.toolbar}>
            <input
              className={styles.search}
              placeholder={t("COMPONENTS.SEARCH")}
              readOnly
            />
            <div className={styles.toolbarRight}>
              <StoreAutocomplete
                onStore={(code) => {
                  setStore(code);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>
          <DataTable
            columns={[
              { key: "id", title: t("COMMON.ID") },
              {
                key: "name",
                title: t("BRAND.BRAND_NAME"),
                render: (row) => row.description?.name ?? "",
              },
              { key: "code", title: t("COMMON.CODE") },
            ]}
            rows={rows}
            getRowId={(row) => row.id ?? row.code}
            loading={loading}
            onEdit={(row) =>
              router.push(`/pages/catalogue/brands/brand/${row.id}`)
            }
            onRemove={(row) => setPending(row)}
          />
          <Pagination
            currentPage={currentPage}
            perPage={PER_PAGE}
            count={total}
            onChange={onPage}
          />
        </section>
        <ConfirmDialog
          open={!!pending}
          onCancel={() => setPending(null)}
          onConfirm={() => void confirmRemove()}
        />
      </div>
    </CatalogueGate>
  );
}
