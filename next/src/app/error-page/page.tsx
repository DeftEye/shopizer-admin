"use client";

import { useRouter } from "next/navigation";

import { AuthCard } from "@/components/auth-card";
import card from "@/components/auth-card.module.css";
import { useI18n } from "@/components/i18n-provider";

import styles from "./error-page.module.css";

export default function ErrorPage() {
  const router = useRouter();
  const { t } = useI18n();

  return (
    <AuthCard>
      <div className={styles.body}>
        <h1 className={styles.status}>Oups</h1>
        <h2 className={styles.title}>{t("ERROR.SERVER_UNAVAILABLE")}</h2>
        <p className={styles.message}>{t("ERROR.SERVER_RETRY")}</p>
        <button
          type="button"
          className={card.button}
          onClick={() => router.push("/")}
        >
          {t("COMPONENTS.TAKE_ME_HOME")}
        </button>
      </div>
    </AuthCard>
  );
}
