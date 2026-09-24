"use client";

import { useI18n } from "@/components/i18n-provider";
import { pageNumbers, type PageAction } from "@/lib/page";

import styles from "./catalog.module.css";

export function Pagination({
  currentPage,
  perPage,
  count,
  pagesToShow = 5,
  onChange,
}: {
  currentPage: number;
  perPage: number;
  count: number;
  pagesToShow?: number;
  onChange: (action: PageAction, data?: number) => void;
}) {
  const { t } = useI18n();
  const totalPages = Math.ceil(count / perPage) || 0;
  if (!count) {
    return null;
  }

  const min = perPage * currentPage - perPage + 1;
  const max = Math.min(perPage * currentPage, count);
  const last = perPage * currentPage >= count;

  return (
    <div className={styles.pager}>
      <span className={styles.range}>
        {min}-{max} {t("COMMON.PAGINATOR_OF")} {count}
      </span>
      <button
        type="button"
        disabled={currentPage <= 1}
        onClick={() => onChange("onFirst")}
        aria-label="First page"
      >
        «
      </button>
      <button
        type="button"
        disabled={currentPage <= 1}
        onClick={() => onChange("onPrev")}
        aria-label="Previous page"
      >
        ‹
      </button>
      {pageNumbers(currentPage, count, perPage, pagesToShow).map((page) => (
        <button
          key={page}
          type="button"
          data-active={page === currentPage}
          onClick={() => onChange("onPage", page)}
        >
          {page}
        </button>
      ))}
      <button
        type="button"
        disabled={last || totalPages === 0}
        onClick={() => onChange("onNext")}
        aria-label="Next page"
      >
        ›
      </button>
      <button
        type="button"
        disabled={last || totalPages === 0}
        onClick={() => onChange("onLast", totalPages)}
        aria-label="Last page"
      >
        »
      </button>
    </div>
  );
}
