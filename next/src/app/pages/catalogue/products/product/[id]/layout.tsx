"use client";

import { useParams } from "next/navigation";

import { ProductTabs } from "../../_components/product-tabs";
import styles from "../../product-children.module.css";

export default function ProductChildLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams<{ id: string }>();
  const productId = String(params.id ?? "");

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <ProductTabs productId={productId} />
      </div>
      {children}
    </div>
  );
}
