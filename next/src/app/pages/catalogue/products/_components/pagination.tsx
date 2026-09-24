"use client";

import { useI18n } from "@/components/i18n-provider";

import styles from "../product-children.module.css";

export type PageChange = {
  action: "onPage" | "onPrev" | "onNext" | "onFirst" | "onLast";
  data: number | null;
};

function getPages(count: number, perPage: number, currentPage: number, pagesToShow: number) {
  const total = Math.ceil(count / perPage) || 0;
  const page = currentPage || 1;
  const pages: number[] = [page];
  for (let i = 0; i < pagesToShow - 1; i++) {
    if (pages.length < pagesToShow && Math.min(...pages) > 1) {
      pages.push(Math.min(...pages) - 1);
    }
    if (pages.length < pagesToShow && Math.max(...pages) < total) {
      pages.push(Math.max(...pages) + 1);
    }
  }
  return pages.sort((a, b) => a - b);
}

export function Pagination({
  currentPage,
  count,
  perPage,
  pagesToShow = 5,
  onChange,
}: {
  currentPage: number;
  count: number;
  perPage: number;
  pagesToShow?: number;
  onChange: (event: PageChange) => void;
}) {
  const { t } = useI18n();
  if (count <= 0) {
    return null;
  }

  const min = perPage * currentPage - perPage + 1;
  const max = Math.min(perPage * currentPage, count);
  const lastPage = perPage * currentPage >= count;
  const totalPages = Math.ceil(count / perPage) || 0;

  return (
    <div className={styles.pager}>
      <span>
        {min} - {max} {t("COMMON.PAGINATOR_OF")} {count}
      </span>
      <div className={styles.pagerButtons}>
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() => onChange({ action: "onFirst", data: null })}
        >
          {"<<"}
        </button>
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() => onChange({ action: "onPrev", data: null })}
        >
          {"<"}
        </button>
        {getPages(count, perPage, currentPage, pagesToShow).map((page) => (
          <button
            key={page}
            type="button"
            className={page === currentPage ? styles.active : undefined}
            onClick={() => onChange({ action: "onPage", data: page })}
          >
            {page}
          </button>
        ))}
        <button
          type="button"
          disabled={lastPage}
          onClick={() => onChange({ action: "onNext", data: null })}
        >
          {">"}
        </button>
        <button
          type="button"
          disabled={lastPage}
          onClick={() => onChange({ action: "onLast", data: totalPages })}
        >
          {">>"}
        </button>
      </div>
    </div>
  );
}

export function applyPageChange(currentPage: number, event: PageChange): number {
  switch (event.action) {
    case "onPage":
      return event.data ?? currentPage;
    case "onPrev":
      return currentPage - 1;
    case "onNext":
      return currentPage + 1;
    case "onFirst":
      return 1;
    case "onLast":
      return event.data ?? currentPage;
  }
}
