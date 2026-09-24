"use client";

import { useRouter } from "next/navigation";

import { useI18n } from "./i18n-provider";
import styles from "./error-card.module.css";

export function ErrorCard({
  code,
  titleKey,
  textKey,
}: {
  code: string;
  titleKey: string;
  textKey: string;
}) {
  const router = useRouter();
  const { t } = useI18n();

  return (
    <div className={styles.card}>
      <h2 className={styles.title}>
        {code} {t(titleKey)}
      </h2>
      <small className={styles.sub}>{t(textKey)}</small>
      <button
        type="button"
        className={styles.button}
        onClick={() => router.push("/pages/home")}
      >
        {t("NOT_FOUND.BACK")}
      </button>
    </div>
  );
}
