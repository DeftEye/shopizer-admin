import { useI18n } from "@/components/i18n-provider";

import styles from "./confirm-dialog.module.css";

export function ConfirmDialog({
  text,
  actionText,
  onConfirm,
  onDismiss,
}: {
  text: string;
  actionText?: string;
  onConfirm: () => void;
  onDismiss: () => void;
}) {
  const { t } = useI18n();

  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true">
      <div className={styles.card}>
        <p>{actionText || t("COMMON.REMOVE_GEN_QUESTION")}</p>
        {text ? <p>{text}</p> : null}
        <div className={styles.actions}>
          <button type="button" onClick={onDismiss}>
            {t("COMMON.CANCEL")}
          </button>
          <button type="button" data-danger="true" onClick={onConfirm}>
            {t("COMMON.REMOVE")}
          </button>
        </div>
      </div>
    </div>
  );
}
