"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { CatalogueGate } from "@/components/catalogue-gate";
import styles from "@/components/catalog.module.css";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DataTable } from "@/components/data-table";
import { useI18n } from "@/components/i18n-provider";
import { StoreAutocomplete } from "@/components/store-autocomplete";
import {
  getListOfProductGroups,
  removeProductGroup,
  updateGroupActiveValue,
} from "@/lib/api/product-groups";
import type { ProductGroup } from "@/lib/api/types";
import { getMerchant } from "@/lib/auth/session";

export default function GroupsListPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [rows, setRows] = useState<ProductGroup[]>([]);
  const [store, setStore] = useState(() => getMerchant() ?? "");
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<ProductGroup | null>(null);

  const load = useCallback(async (merchant: string) => {
    setLoading(true);
    try {
      const groups = await getListOfProductGroups(merchant);
      setRows(Array.isArray(groups) ? groups : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void load(store);
    }, 0);
    return () => window.clearTimeout(id);
  }, [load, store]);

  async function toggleActive(row: ProductGroup) {
    const next = { code: row.code, active: !row.active };
    await updateGroupActiveValue(next);
    setRows((current) =>
      current.map((item) => (item.code === row.code ? next : item)),
    );
  }

  return (
    <CatalogueGate>
      <div className={styles.page}>
        <header className={styles.header}>
          <h1 className={styles.title}>{t("COMPONENTS.PRODUCTS_GROUPS_LIST")}</h1>
        </header>
        <section className={styles.card}>
          <div className={styles.toolbar}>
            <div className={styles.toolbarRight}>
              <StoreAutocomplete
                onStore={(code) => {
                  setStore(code);
                }}
              />
              <Link
                className={styles.createLink}
                href="/pages/catalogue/products-groups/create-products-group"
              >
                {t("COMPONENTS.CREATE_PRODUCTS_GROUPS")}
              </Link>
            </div>
          </div>
          <DataTable
            columns={[
              { key: "code", title: t("COMMON.CODE") },
              {
                key: "active",
                title: t("COMMON.ACTIVE"),
                render: (row) => (
                  <input
                    type="checkbox"
                    checked={!!row.active}
                    onChange={() => void toggleActive(row)}
                    aria-label={`${t("COMMON.ACTIVE")} ${row.code}`}
                  />
                ),
              },
            ]}
            rows={rows}
            getRowId={(row) => row.code}
            loading={loading}
            onEdit={(row) =>
              router.push(
                `/pages/catalogue/products-groups/create-products-group/${row.code}`,
              )
            }
            onRemove={(row) => setPending(row)}
          />
        </section>
        <ConfirmDialog
          open={!!pending}
          onCancel={() => setPending(null)}
          onConfirm={async () => {
            if (!pending) {
              return;
            }
            await removeProductGroup(pending.code);
            setPending(null);
            await load(store);
          }}
        />
      </div>
    </CatalogueGate>
  );
}
