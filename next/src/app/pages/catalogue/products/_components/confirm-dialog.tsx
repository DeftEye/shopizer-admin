"use client";

import { useI18n } from "@/components/i18n-provider";

import styles from "../product-children.module.css";

export function ConfirmDialog({
  open,
  text = "",
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
    <div className={styles.dialogBackdrop} role="dialog" aria-modal="true">
      <div className={styles.dialog}>
        <p>
          {t("COMMON.REMOVE_GEN_QUESTION")} {text}
        </p>
        <div className={styles.actions}>
          <button type="button" className={styles.cancel} onClick={onCancel}>
            {t("COMMON.CANCEL")}
          </button>
          <button type="button" className={styles.primary} onClick={onConfirm}>
            {t("COMMON.OK")}
          </button>
        </div>
      </div>
    </div>
  );
}
