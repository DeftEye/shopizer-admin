"use client";

import { useI18n } from "@/components/i18n-provider";

import styles from "./catalog.module.css";

export function ConfirmDialog({
  open,
  text,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  text?: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { t } = useI18n();
  if (!open) {
    return null;
  }

  return (
    <div className={styles.dialogBackdrop} role="presentation">
      <div className={styles.dialog} role="dialog" aria-modal="true">
        <p className={styles.dialogText}>
          {text || t("COMMON.REMOVE_QUESTION")}
        </p>
        <div className={styles.dialogActions}>
          <button type="button" className={styles.secondary} onClick={onCancel}>
            {t("COMMON.CANCEL")}
          </button>
          <button
            type="button"
            className={`${styles.primary} ${styles.danger}`}
            onClick={onConfirm}
          >
            {t("COMMON.OK")}
          </button>
        </div>
      </div>
    </div>
  );
}
