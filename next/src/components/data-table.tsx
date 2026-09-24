"use client";

import { useI18n } from "@/components/i18n-provider";

import styles from "./catalog.module.css";

export type DataColumn<T> = {
  key: string;
  title: string;
  render?: (row: T) => React.ReactNode;
};

export function DataTable<T>({
  columns,
  rows,
  getRowId,
  loading,
  onEdit,
  onRemove,
  extra,
}: {
  columns: DataColumn<T>[];
  rows: T[];
  getRowId: (row: T) => string | number;
  loading?: boolean;
  onEdit?: (row: T) => void;
  onRemove?: (row: T) => void;
  extra?: (row: T) => React.ReactNode;
}) {
  const { t } = useI18n();

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.title}</th>
            ))}
            {onEdit || onRemove || extra ? <th>{t("COMMON.ACTIONS")}</th> : null}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length + 1}>…</td>
            </tr>
          ) : null}
          {!loading && rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length + 1}>{t("COMMON.NO_ITEMS")}</td>
            </tr>
          ) : null}
          {!loading
            ? rows.map((row) => (
                <tr key={String(getRowId(row))}>
                  {columns.map((column) => (
                    <td key={column.key}>
                      {column.render
                        ? column.render(row)
                        : String(
                            (row as Record<string, unknown>)[column.key] ?? "",
                          )}
                    </td>
                  ))}
                  {onEdit || onRemove || extra ? (
                    <td>
                      <div className={styles.actions}>
                        {extra ? extra(row) : null}
                        {onEdit ? (
                          <button
                            type="button"
                            className={styles.linkButton}
                            onClick={() => onEdit(row)}
                          >
                            {t("COMMON.EDIT")}
                          </button>
                        ) : null}
                        {onRemove ? (
                          <button
                            type="button"
                            className={`${styles.iconButton} ${styles.iconButtonDanger}`}
                            onClick={() => onRemove(row)}
                          >
                            {t("COMMON.REMOVE")}
                          </button>
                        ) : null}
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))
            : null}
        </tbody>
      </table>
    </div>
  );
}
