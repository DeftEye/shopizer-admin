"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { useI18n } from "@/components/i18n-provider";
import { ProductForm } from "@/components/catalogue/product-form";
import {
  getProductById,
  readApiErrorMessage,
} from "@/lib/catalogue/products-api";
import type { ProductDetail } from "@/lib/catalogue/types";

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const { t } = useI18n();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getProductById(params.id)
      .then((result) => {
        if (!cancelled) {
          setProduct(result);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(readApiErrorMessage(err, t("COMMON.INTERNAL_SERVER_ERROR")));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [params.id, t]);

  if (error) {
    return <p role="alert">{error}</p>;
  }
  if (!product?.id) {
    return <p>…</p>;
  }

  return <ProductForm product={product} titleKey="COMPONENTS.PRODUCT" />;
}
