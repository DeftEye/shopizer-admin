"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { useI18n } from "@/components/i18n-provider";
import {
  deleteInventory,
  getInventories,
  getProductById,
  type InventoryItem,
  type ProductSummary,
} from "@/lib/api/product-children";
import { getLang } from "@/lib/auth/session";

import { BackButton } from "../../_components/back-button";
import { ConfirmDialog } from "../../_components/confirm-dialog";
import { applyPageChange, Pagination, type PageChange } from "../../_components/pagination";
import styles from "../../product-children.module.css";

const PER_PAGE = 10;

export default function InventoryListPage() {
  const { t } = useI18n();
  const params = useParams<{ productId: string }>();
  const router = useRouter();
  const productId = String(params.productId ?? "");
  const [product, setProduct] = useState<ProductSummary | null>(null);
  const [rows, setRows] = useState<InventoryItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [removeId, setRemoveId] = useState<string | number | undefined>();

  useEffect(() => {
    void getProductById(productId).then(setProduct);
  }, [productId]);

  const getList = useCallback(async () => {
    setLoading(true);
    try {
      const id = product?.id ?? productId;
      const res = await getInventories(id, {
        count: PER_PAGE,
        page: currentPage - 1,
        lang: getLang(),
      });
      setRows(res.items ?? []);
      setTotalCount(res.recordsTotal ?? 0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, product?.id, productId]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void getList();
    }, 0);
    return () => window.clearTimeout(id);
  }, [getList]);

  function storeCode(row: InventoryItem) {
    return typeof row.store === "string" ? row.store : row.store?.code;
  }

  function priceLabel(row: InventoryItem) {
    return row.prices?.length && row.prices[0].originalPrice
      ? row.prices[0].originalPrice
      : "null";
  }

  return (
    <div className={styles.page}>
      <section className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>{product?.description?.name}</h1>
        </div>
        <div className={styles.toolbar}>
          <BackButton />
          <Link
            className={styles.create}
            href={`/pages/catalogue/products/${productId}/inventory-creation`}
          >
            + {t("INVENTORY.ADD_TO_INVENTORY")}
          </Link>
        </div>
        {loading ? <p className={styles.status}>…</p> : null}
        {message ? <p className={`${styles.status} ${styles.statusOk}`}>{message}</p> : null}
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{t("INVENTORY.INVENTORY_STORE")}</th>
                <th>{t("INVENTORY.INVENTORY_OWNER")}</th>
                <th>{t("PRODUCT.QTY")}</th>
                <th>{t("PRODUCT.PRICE")}</th>
                <th>{t("PRODUCT.CREATION_DATE")}</th>
                <th>{t("ORDER.ACTIONS")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={String(row.id)}>
                  <td>{storeCode(row)}</td>
                  <td>{row.owner ? row.owner : "null"}</td>
                  <td>{row.quantity}</td>
                  <td>{priceLabel(row)}</td>
                  <td>{row.creationDate}</td>
                  <td>
                    <button
                      type="button"
                      className={styles.iconButton}
                      onClick={() =>
                        router.push(
                          `/pages/catalogue/products/${product?.id ?? productId}/inventory/${row.id}`,
                        )
                      }
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
          onChange={(event: PageChange) =>
            setCurrentPage((page) => applyPageChange(page, event))
          }
        />
      </section>
      <ConfirmDialog
        open={removeId !== undefined}
        onCancel={() => setRemoveId(undefined)}
        onConfirm={() => {
          if (removeId === undefined) {
            return;
          }
          void deleteInventory(removeId).then(() => {
            setMessage(t("INVENTORY.INVENTORY_REMOVED"));
            setRemoveId(undefined);
            void getList();
          });
        }}
      />
    </div>
  );
}
