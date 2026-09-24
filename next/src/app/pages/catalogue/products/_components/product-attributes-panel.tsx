"use client";

import { useCallback, useEffect, useState } from "react";

import { useI18n } from "@/components/i18n-provider";
import {
  deleteAttribute,
  getProductAttributes,
  listAttributesParams,
  type ProductAttribute,
} from "@/lib/api/product-children";

import { AttributeFormDialog } from "./attribute-form-dialog";
import { ConfirmDialog } from "./confirm-dialog";
import { applyPageChange, Pagination, type PageChange } from "./pagination";
import styles from "../product-children.module.css";

const PER_PAGE = 20;

export function ProductAttributesPanel({ productId }: { productId: string }) {
  const { t } = useI18n();
  const [rows, setRows] = useState<ProductAttribute[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<number | string | undefined>();
  const [removeId, setRemoveId] = useState<number | string | undefined>();

  const getList = useCallback(async () => {
    setLoading(true);
    try {
      const params = listAttributesParams(PER_PAGE, currentPage - 1);
      const res = await getProductAttributes(productId, params);
      const tempArray = (res.attributes ?? []).filter(
        (value) => value.attributeDisplayOnly === false,
      );
      setRows(tempArray);
      setTotalCount(res.recordsTotal ?? 0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, productId]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void getList();
    }, 0);
    return () => window.clearTimeout(id);
  }, [getList]);

  function changePage(event: PageChange) {
    setCurrentPage((page) => applyPageChange(page, event));
  }

  async function confirmRemove() {
    if (removeId === undefined) {
      return;
    }
    setLoading(true);
    try {
      await deleteAttribute(productId, removeId);
      setMessage(t("PRODUCT_ATTRIBUTES.PRODUCT_ATTRIBUTES_REMOVED"));
      setRemoveId(undefined);
      await getList();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.card}>
      <div className={styles.toolbar}>
        <span />
        <button
          type="button"
          className={styles.create}
          onClick={() => {
            setEditId(undefined);
            setFormOpen(true);
          }}
        >
          + {t("COMPONENTS.CREATE_PRODUCT_ATTRIBUTES")}
        </button>
      </div>
      {loading ? <p className={styles.status}>{t("COMMON.SEARCH")}…</p> : null}
      {message ? <p className={`${styles.status} ${styles.statusOk}`}>{message}</p> : null}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>{t("COMMON.ID")}</th>
              <th>{t("PRODUCT_ATTRIBUTES.OPTION_NAME")}</th>
              <th>{t("PRODUCT_ATTRIBUTES.PRODUCT_OPTION")}</th>
              <th>{t("PRODUCT_ATTRIBUTES.PRICE")}</th>
              <th>{t("COMMON.ORDER")}</th>
              <th>{t("ORDER.ACTIONS")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={String(row.id)}>
                <td>{row.id}</td>
                <td>{row.option?.code}</td>
                <td>{row.optionValue?.code}</td>
                <td>{row.productAttributePrice}</td>
                <td>{row.sortOrder}</td>
                <td>
                  <button
                    type="button"
                    className={styles.iconButton}
                    onClick={() => {
                      setEditId(row.id);
                      setFormOpen(true);
                    }}
                  >
                    {t("COMMON.EDIT")}
                  </button>
                  <button
                    type="button"
                    className={`${styles.iconButton} ${styles.danger}`}
                    onClick={() => setRemoveId(row.id)}
                  >
                    {t("COMMON.REMOVE")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination
        currentPage={currentPage}
        count={totalCount}
        perPage={PER_PAGE}
        onChange={changePage}
      />
      {formOpen ? (
        <AttributeFormDialog
          productId={productId}
          attributeId={editId}
          onClose={() => {
            setFormOpen(false);
            void getList();
          }}
        />
      ) : null}
      <ConfirmDialog
        open={removeId !== undefined}
        onCancel={() => setRemoveId(undefined)}
        onConfirm={() => void confirmRemove()}
      />
    </div>
  );
}
