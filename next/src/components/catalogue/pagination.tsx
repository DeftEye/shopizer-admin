import { visiblePages } from "@/lib/catalogue/pagination";

import styles from "./catalogue-page.module.css";

export function Pagination({
  currentPage,
  perPage,
  count,
  onPage,
}: {
  currentPage: number;
  perPage: number;
  count: number;
  onPage: (page: number) => void;
}) {
  const total = Math.ceil(count / perPage) || 0;
  if (total <= 1) {
    return null;
  }

  const pages = visiblePages(currentPage, count, perPage, 5);

  return (
    <div className={styles.pager}>
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
  );
}
