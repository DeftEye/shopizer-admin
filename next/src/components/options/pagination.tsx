import { pageRange, visiblePages } from "@/lib/catalogue/options-helpers";

import styles from "./options-page.module.css";

export function Pagination({
  currentPage,
  perPage,
  count,
  onPage,
  ofLabel,
}: {
  currentPage: number;
  perPage: number;
  count: number;
  onPage: (page: number) => void;
  ofLabel: string;
}) {
  if (count <= 0) {
    return null;
  }

  const total = Math.ceil(count / perPage) || 0;
  const pages = visiblePages(currentPage, count, perPage, 5);
  const range = pageRange(currentPage, perPage, count);

  return (
    <div className={styles.pager}>
      <span className={styles.pageCounts}>
        {range.min} - {range.max} {ofLabel} {count}
      </span>
      <div className={styles.pageButtons}>
        <button
          type="button"
          className={styles.pageButton}
          disabled={currentPage <= 1}
          onClick={() => onPage(1)}
        >
          «
        </button>
        <button
          type="button"
          className={styles.pageButton}
          disabled={currentPage <= 1}
          onClick={() => onPage(currentPage - 1)}
        >
          ‹
        </button>
        {pages.map((page) => (
          <button
            key={page}
            type="button"
            className={`${styles.pageButton} ${
              page === currentPage ? styles.pageButtonActive : ""
            }`}
            onClick={() => onPage(page)}
          >
            {page}
          </button>
        ))}
        <button
          type="button"
          className={styles.pageButton}
          disabled={currentPage >= total}
          onClick={() => onPage(currentPage + 1)}
        >
          ›
        </button>
        <button
          type="button"
          className={styles.pageButton}
          disabled={currentPage >= total}
          onClick={() => onPage(total)}
        >
          »
        </button>
      </div>
    </div>
  );
}
