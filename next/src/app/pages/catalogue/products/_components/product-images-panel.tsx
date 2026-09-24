"use client";

import { useCallback, useEffect, useState } from "react";

import { useI18n } from "@/components/i18n-provider";
import {
  addImageUrl,
  getProductImages,
  normalizeImages,
  removeProductImage,
  updateProductImageOrder,
  type ProductImage,
} from "@/lib/api/product-children";
import { apiErrorMessage } from "@/lib/validation";

import { ImageUploading } from "./image-uploading";
import styles from "../product-children.module.css";

export function ProductImagesPanel({ productId }: { productId: string }) {
  const { t } = useI18n();
  const [images, setImages] = useState<ProductImage[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getProductImages(productId);
      setImages(normalizeImages(res));
      setLoaded(true);
    } catch (err) {
      setError(apiErrorMessage(err) || t("COMMON.INTERNAL_SERVER_ERROR"));
    } finally {
      setLoading(false);
    }
  }, [productId, t]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(id);
  }, [load]);

  async function onRemove(imageId: string | number) {
    setLoading(true);
    try {
      await removeProductImage(productId, imageId);
      setMessage(t("PRODUCT.PRODUCT_UPDATED"));
      await load();
    } catch (err) {
      setError(apiErrorMessage(err) || t("COMMON.ERROR"));
      setLoading(false);
    }
  }

  async function onUpdate(event: { id: string | number; position: number }) {
    setLoading(true);
    try {
      await updateProductImageOrder(productId, event);
      await load();
    } catch (err) {
      setError(apiErrorMessage(err) || t("COMMON.ERROR"));
      setLoading(false);
    }
  }

  return (
    <div className={styles.card}>
      <div className={styles.body}>
        {loading ? <p className={styles.muted}>…</p> : null}
        {error ? <p className={`${styles.status} ${styles.statusError}`}>{error}</p> : null}
        {message ? <p className={`${styles.status} ${styles.statusOk}`}>{message}</p> : null}
        {loaded ? (
          <ImageUploading
            images={images}
            addImageUrl={addImageUrl(productId)}
            onRemove={onRemove}
            onUpdate={onUpdate}
            onError={(code) => setError(t(`COMMON.${code}`))}
            onSuccess={() => {
              setMessage(t("PRODUCT.PRODUCT_UPDATED"));
              void load();
            }}
            onFileAdded={() => void load()}
          />
        ) : null}
      </div>
    </div>
  );
}
