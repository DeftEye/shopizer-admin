"use client";

import { useRouter } from "next/navigation";

import { useI18n } from "@/components/i18n-provider";

import styles from "../product-children.module.css";

export function BackButton() {
  const router = useRouter();
  const { t } = useI18n();

  return (
    <button type="button" className={styles.back} onClick={() => router.back()}>
      ← {t("COMMON.BACK_TO_LIST")}
    </button>
  );
}
