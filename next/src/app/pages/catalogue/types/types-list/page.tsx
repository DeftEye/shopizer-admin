"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { CatalogueGate } from "@/components/catalogue-gate";
import styles from "@/components/catalog.module.css";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DataTable } from "@/components/data-table";
import { useI18n } from "@/components/i18n-provider";
import { Pagination } from "@/components/pagination";
import { StoreAutocomplete } from "@/components/store-autocomplete";
import { deleteType, getListOfTypes } from "@/lib/api/product-types";
import type { ProductType } from "@/lib/api/types";
import { getLang, getMerchant } from "@/lib/auth/session";
import { nextPage, type PageAction } from "@/lib/page";

const PER_PAGE = 15;

export default function TypesListPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [rows, setRows] = useState<ProductType[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [store, setStore] = useState(() => getMerchant() ?? "");
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<ProductType | null>(null);
  const [message, setMessage] = useState("");

  const load = useCallback(
    async (page: number, merchant: string) => {
      setLoading(true);
      try {
        const res = await getListOfTypes({
          store: merchant,
          lang: getLang(),
          count: PER_PAGE,
          page: page - 1,
        });
        setRows(res.list ?? []);
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

  async function confirmRemove() {
    if (pending?.id == null || pending.id === "") {
      return;
    }
    await deleteType(pending.id);
    setPending(null);
    setMessage(t("OPTION.OPTION_REMOVED"));
    await load(currentPage, store);
  }

  return (
    <CatalogueGate>
      <div className={styles.page}>
        <header className={styles.header}>
          <h1 className={styles.title}>{t("PRODUCT_TYPE.PRODUCT_TYPE_LIST")}</h1>
        </header>
        <section className={styles.card}>
          {message ? (
            <p className={`${styles.banner} ${styles.bannerSuccess}`}>{message}</p>
          ) : null}
          <div className={styles.toolbar}>
            <div className={styles.toolbarRight}>
              <StoreAutocomplete
                onStore={(code) => {
                  setStore(code);
                  setCurrentPage(1);
                }}
              />
              <Link
                className={styles.createLink}
                href="/pages/catalogue/types/create-type"
              >
                {t("PRODUCT_TYPE.PRODUCT_TYPE_CREATE")}
              </Link>
            </div>
          </div>
          <DataTable
            columns={[
              { key: "id", title: t("COMMON.ID") },
              { key: "store", title: t("STORE.MERCHANT_STORE") },
              { key: "code", title: t("COMMON.CODE") },
            ]}
            rows={rows}
            getRowId={(row) => row.id ?? row.code}
            loading={loading}
            onEdit={(row) =>
              router.push(`/pages/catalogue/types/type/${row.id}`)
            }
            onRemove={(row) => setPending(row)}
          />
          <Pagination
            currentPage={currentPage}
            perPage={PER_PAGE}
            count={total}
            onChange={(action: PageAction, data?: number) =>
              setCurrentPage(nextPage(action, currentPage, data))
            }
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
