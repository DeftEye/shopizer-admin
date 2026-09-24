"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AdminRoute } from "@/components/admin-route";
import { useI18n } from "@/components/i18n-provider";
import { ApiError } from "@/lib/api/client";
import type { StoreName, UserListItem } from "@/lib/api/types";
import {
  getMerchantStoreNames,
  getUsersList,
  updateUserEnabled,
} from "@/lib/api/users";
import { isAnAdmin, isSuperAdmin } from "@/lib/auth/roles";
import { getLang, getMerchant, getRoles, getUserId } from "@/lib/auth/session";
import { visiblePages } from "@/lib/auth/user-form";
import { USERS_PAGE_SIZE } from "@/lib/constants";

import styles from "./users.module.css";

type ListParams = {
  lang: string;
  store: string;
  count: number;
  page: number;
  name?: string;
  emailAddress?: string;
};

function loadParams(): ListParams {
  return {
    lang: getLang(),
    store: getMerchant() ?? "",
    count: USERS_PAGE_SIZE,
    page: 0,
  };
}

export default function UsersListPage() {
  return (
    <AdminRoute>
      <UsersList />
    </AdminRoute>
  );
}

function UsersList() {
  const { t } = useI18n();
  const router = useRouter();
  const flags = useMemo(() => getRoles(), []);
  const superadmin = isSuperAdmin(flags);
  const admin = isAnAdmin(flags);
  const currentUserId = getUserId();

  const [params, setParams] = useState<ListParams>(loadParams);
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState<StoreName[]>([]);
  const [nameFilter, setNameFilter] = useState("");
  const [emailFilter, setEmailFilter] = useState("");
  const [banner, setBanner] = useState<{ kind: "success" | "error"; text: string } | null>(
    null,
  );

  const fetchList = useCallback(async (next: ListParams) => {
    setLoading(true);
    try {
      const res = await getUsersList(next);
      const rows = (res.data ?? []).map((user) => ({
        ...user,
        name: `${user.firstName} ${user.lastName}`,
      }));
      setUsers(rows);
      setTotalCount(res.recordsTotal ?? 0);
      setTotalPages(res.totalPages ?? 0);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void fetchList(params);
    }, 0);
    return () => window.clearTimeout(id);
  }, [fetchList, params]);

  useEffect(() => {
    if (!superadmin) {
      return;
    }
    getMerchantStoreNames(getMerchant() ?? "")
      .then(setStores)
      .catch(() => undefined);
  }, [superadmin]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setCurrentPage(1);
      setParams((current) => {
        const next: ListParams = {
          ...current,
          page: 0,
          name: nameFilter.trim() || undefined,
          emailAddress: emailFilter.trim() || undefined,
        };
        if (
          current.name === next.name &&
          current.emailAddress === next.emailAddress
        ) {
          return current;
        }
        return next;
      });
    }, 400);
    return () => window.clearTimeout(handle);
  }, [nameFilter, emailFilter]);

  function goToPage(page: number) {
    setCurrentPage(page);
    setParams((current) => ({ ...current, page: page - 1 }));
  }

  function choseStore(store: string) {
    setCurrentPage(1);
    setParams((current) => ({ ...current, store, page: 0 }));
  }

  async function toggleActive(user: UserListItem) {
    if (user.id === Number(currentUserId)) {
      setBanner({ kind: "error", text: t("USER_FORM.CANT_UPDATE_YOUR_PROFILE") });
      return;
    }
    const next = { ...user, active: !user.active };
    setUsers((current) =>
      current.map((row) => (row.id === user.id ? next : row)),
    );
    try {
      await updateUserEnabled(next);
      setBanner({ kind: "success", text: t("USER.AVAILABILITY") });
    } catch (error) {
      setUsers((current) =>
        current.map((row) => (row.id === user.id ? user : row)),
      );
      const message =
        error instanceof ApiError ? error.message : t("COMMON.INTERNAL_SERVER_ERROR");
      setBanner({ kind: "error", text: message });
    }
  }

  const pages = visiblePages(currentPage, totalPages, 5);
  const min = totalCount === 0 ? 0 : (USERS_PAGE_SIZE * currentPage - USERS_PAGE_SIZE) + 1;
  const max = Math.min(USERS_PAGE_SIZE * currentPage, totalCount);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t("COMPONENTS.USERS")}</h1>
      </header>
      {banner ? (
        <p className={`${styles.banner} ${banner.kind === "success" ? styles.success : styles.error}`}>
          {banner.text}
        </p>
      ) : null}
      <div className={styles.filters}>
        <input
          className={styles.input}
          value={nameFilter}
          onChange={(event) => setNameFilter(event.target.value)}
          placeholder={t("COMMON.NAME")}
          aria-label={t("COMMON.NAME")}
        />
        <input
          className={styles.input}
          value={emailFilter}
          onChange={(event) => setEmailFilter(event.target.value)}
          placeholder={t("COMMON.EMAIL_ADDRESS")}
          aria-label={t("COMMON.EMAIL_ADDRESS")}
        />
        {superadmin ? (
          <select
            className={styles.select}
            value={params.store}
            onChange={(event) => choseStore(event.target.value)}
            aria-label={t("STORE.MERCHANT_STORE")}
          >
            {params.store && !stores.some((store) => store.code === params.store) ? (
              <option value={params.store}>{params.store}</option>
            ) : null}
            {stores.map((store) => (
              <option key={store.code} value={store.code}>
                {store.code}
              </option>
            ))}
          </select>
        ) : null}
      </div>
      <div className={styles.card}>
        {loading && users.length === 0 ? (
          <p className={styles.empty}>…</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{t("COMMON.ID")}</th>
                <th>{t("COMMON.NAME")}</th>
                <th>{t("COMMON.EMAIL_ADDRESS")}</th>
                <th>{t("COMMON.STATUS")}</th>
                {admin ? <th /> : null}
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className={styles.row}>
                  <td>{user.id}</td>
                  <td>{user.name}</td>
                  <td>{user.emailAddress}</td>
                  <td>
                    <input
                      type="checkbox"
                      checked={!!user.active}
                      onChange={() => void toggleActive(user)}
                      aria-label={`${t("COMMON.STATUS")} ${user.emailAddress}`}
                    />
                  </td>
                  {admin ? (
                    <td>
                      <button
                        type="button"
                        className={styles.edit}
                        onClick={() =>
                          router.push(`/pages/user-management/user/${user.id}`)
                        }
                      >
                        {t("COMMON.EDIT")}
                      </button>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {totalCount > 0 ? (
        <div className={styles.pager}>
          <span className={styles.counts}>
            {min} - {max} {t("COMMON.PAGINATOR_OF")} {totalCount}
          </span>
          <div className={styles.pages}>
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => goToPage(1)}
            >
              {"<<"}
            </button>
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => goToPage(currentPage - 1)}
            >
              {"<"}
            </button>
            {pages.map((page) => (
              <button
                key={page}
                type="button"
                data-active={page === currentPage}
                onClick={() => goToPage(page)}
              >
                {page}
              </button>
            ))}
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => goToPage(currentPage + 1)}
            >
              {">"}
            </button>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => goToPage(totalPages)}
            >
              {">>"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
