"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { DataTable, type DataColumn } from "@/components/data-table";
import { useI18n } from "@/components/i18n-provider";
import { Pagination, type PageAction } from "@/components/pagination";
import { RoleGate } from "@/components/role-gate";
import { asStoreList, deleteStore, getListOfStores } from "@/lib/api/store";
import type { StoreDetails } from "@/lib/api/types";
import { canAccessStoresList } from "@/lib/auth/gate";
import { isAnAdmin } from "@/lib/auth/roles";
import { getMerchant, getRoles } from "@/lib/auth/session";

import styles from "@/components/store-page.module.css";

const PER_PAGE = 10;

export default function StoresListPage() {
  return (
    <RoleGate allow={canAccessStoresList}>
      <StoresList />
    </RoleGate>
  );
}

function StoresList() {
  const { t } = useI18n();
  const router = useRouter();
  const [rows, setRows] = useState<StoreDetails[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ name: "", email: "" });
  const [applied, setApplied] = useState({ name: "", email: "" });
  const [pendingDelete, setPendingDelete] = useState<StoreDetails | null>(null);
  const [blockedDelete, setBlockedDelete] = useState(false);
  const [message, setMessage] = useState("");
  const admin = isAnAdmin(getRoles());

  useEffect(() => {
    const id = window.setTimeout(() => setApplied(filters), 300);
    return () => window.clearTimeout(id);
  }, [filters]);

  async function loadList(page = currentPage) {
    setLoading(true);
    const merchant = getMerchant() ?? "";
    const params: Record<string, string | number> = {
      count: PER_PAGE,
      page: page - 1,
      store: merchant,
    };
    if (applied.name) {
      params.name = applied.name;
    }
    if (applied.email) {
      params.email = applied.email;
    }
    try {
      const res = asStoreList(await getListOfStores(params));
      setRows(res.data);
      setTotalCount(res.recordsTotal);
      setTotalPages(res.totalPages || Math.ceil(res.recordsTotal / PER_PAGE) || 1);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const id = window.setTimeout(() => {
      void loadList(currentPage);
    }, 0);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, applied.name, applied.email]);

  useEffect(() => {
    const id = window.setTimeout(() => setCurrentPage(1), 0);
    return () => window.clearTimeout(id);
  }, [applied.name, applied.email]);

  const columns = useMemo<DataColumn<StoreDetails>[]>(
    () => [
      { key: "id", title: t("COMMON.ID") },
      { key: "code", title: t("COMMON.CODE") },
      {
        key: "retailer",
        title: t("COMPONENTS.RETAILER"),
        render: (row) => String(!!row.retailer),
      },
      { key: "name", title: t("COMMON.STORE_NAME"), filter: true },
      { key: "email", title: t("COMMON.EMAIL_ADDRESS"), filter: true },
    ],
    [t],
  );

  function changePage(event: PageAction) {
    switch (event.action) {
      case "onPage":
        setCurrentPage(event.data);
        break;
      case "onPrev":
        setCurrentPage((page) => Math.max(1, page - 1));
        break;
      case "onNext":
        setCurrentPage((page) => page + 1);
        break;
      case "onLast":
        setCurrentPage(totalPages);
        break;
      case "onFirst":
        setCurrentPage(1);
        break;
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) {
      return;
    }
    await deleteStore(pendingDelete.code);
    setMessage(t("USER_FORM.USER_REMOVED"));
    setPendingDelete(null);
    void loadList(currentPage);
  }

  function onRemove(row: StoreDetails) {
    if (row.code === getMerchant()) {
      setBlockedDelete(true);
      return;
    }
    setPendingDelete(row);
  }

  return (
    <div className={styles.page} style={{ maxWidth: "72rem" }}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t("COMPONENTS.STORES")}</h1>
      </header>
      {message ? <p className={`${styles.banner} ${styles.bannerSuccess}`}>{message}</p> : null}
      <div className={styles.card} style={{ padding: "0.5rem 0.75rem 1rem" }}>
        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          filters={filters}
          onFilter={(field, value) =>
            setFilters((current) => ({ ...current, [field]: value }))
          }
          actions={
            admin
              ? (row) => (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        router.push(`/pages/store-management/store/${row.code}`)
                      }
                    >
                      {t("COMMON.EDIT")}
                    </button>
                    <button type="button" data-danger="true" onClick={() => onRemove(row)}>
                      {t("COMMON.REMOVE")}
                    </button>
                  </>
                )
              : undefined
          }
        />
        <Pagination
          currentPage={currentPage}
          count={totalCount}
          perPage={PER_PAGE}
          onChange={changePage}
        />
      </div>
      {blockedDelete ? (
        <ConfirmDialog
          text=""
          actionText={t("USER_FORM.CANT_DELETE_YOUR_PROFILE")}
          onConfirm={() => setBlockedDelete(false)}
          onDismiss={() => setBlockedDelete(false)}
        />
      ) : null}
      {pendingDelete ? (
        <ConfirmDialog
          text={`${pendingDelete.name} ? `}
          onConfirm={() => void confirmDelete()}
          onDismiss={() => setPendingDelete(null)}
        />
      ) : null}
    </div>
  );
}
