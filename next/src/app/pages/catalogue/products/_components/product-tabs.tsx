"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useI18n } from "@/components/i18n-provider";

import styles from "../product-children.module.css";

export function ProductTabs({ productId }: { productId: string }) {
  const { t } = useI18n();
  const pathname = usePathname();
  const base = `/pages/catalogue/products/product/${productId}`;
  const tabs = [
    { href: `${base}/images`, key: "COMPONENTS.PRODUCTS_IMAGES", match: ["/images", "/default"] },
    { href: `${base}/options`, key: "COMPONENTS.OPTIONS_CONFIG", match: ["/options"] },
    { href: `${base}/discount`, key: "COMPONENTS.PRODUCTS_DISCOUNT", match: ["/discount"] },
  ];

  return (
    <nav className={styles.tabs} id="tabs">
      {tabs.map((tab) => {
        const active = tab.match.some((suffix) => pathname.endsWith(suffix));
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`${styles.tab} ${active ? styles.tabActive : ""}`}
          >
            {t(tab.key)}
          </Link>
        );
      })}
    </nav>
  );
}
