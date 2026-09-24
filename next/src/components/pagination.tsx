import { useI18n } from "@/components/i18n-provider";

import styles from "./pagination.module.css";

export type PageAction =
  | { action: "onPage"; data: number }
  | { action: "onPrev"; data: null }
  | { action: "onNext"; data: null }
  | { action: "onFirst"; data: null }
  | { action: "onLast"; data: number };

function pageWindow(current: number, total: number, pagesToShow: number): number[] {
  const pages: number[] = [];
  if (total < 1) {
    return pages;
  }
  const safeCurrent = Math.min(Math.max(current, 1), total);
  pages.push(safeCurrent);
  while (pages.length < pagesToShow) {
    const min = Math.min(...pages);
    const max = Math.max(...pages);
    if (min > 1) {
      pages.push(min - 1);
    }
    if (pages.length < pagesToShow && max < total) {
      pages.push(max + 1);
    }
    if (min <= 1 && max >= total) {
      break;
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
  onChange: (event: PageAction) => void;
}) {
  const { t } = useI18n();
  if (count <= 0) {
    return null;
  }

  const total = Math.ceil(count / perPage) || 0;
  const min = perPage * currentPage - perPage + 1;
  const max = Math.min(perPage * currentPage, count);
  const lastPage = perPage * currentPage >= count;
  const pages = pageWindow(currentPage, total, pagesToShow);

  return (
    <div className={styles.bar}>
      <span>
        {min} - {max} {t("COMMON.PAGINATOR_OF")} {count}
      </span>
      <div className={styles.numbers}>
        <button type="button" disabled={currentPage === 1} onClick={() => onChange({ action: "onFirst", data: null })}>
          {"<<"}
        </button>
        <button type="button" disabled={currentPage === 1} onClick={() => onChange({ action: "onPrev", data: null })}>
          {"<"}
        </button>
        {pages.map((page) => (
          <button
            key={page}
            type="button"
            data-active={page === currentPage ? "true" : "false"}
            onClick={() => onChange({ action: "onPage", data: page })}
          >
            {page}
          </button>
        ))}
        <button type="button" disabled={lastPage} onClick={() => onChange({ action: "onNext", data: null })}>
          {">"}
        </button>
        <button
          type="button"
          disabled={lastPage}
          onClick={() => onChange({ action: "onLast", data: total })}
        >
          {">>"}
        </button>
      </div>
    </div>
  );
}
