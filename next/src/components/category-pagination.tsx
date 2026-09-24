import { useI18n } from "@/components/i18n-provider";
import { visiblePages } from "@/lib/catalogue/pagination";

import styles from "./category-page.module.css";

export function CategoryPagination({
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
  const { t } = useI18n();
  if (count <= 0) {
    return null;
  }

  const total = Math.ceil(count / perPage) || 0;
  const min = perPage * currentPage - perPage + 1;
  const max = Math.min(perPage * currentPage, count);
  const pages = visiblePages(currentPage, count, perPage, 5);

  return (
    <div className={styles.pager}>
      <span>
        {min} - {max} {t("COMMON.PAGINATOR_OF")} {count}
      </span>
      <div className={styles.numbers}>
        <button
          type="button"
          className={styles.pageButton}
          disabled={currentPage === 1}
          onClick={() => onPage(1)}
        >
          {"<<"}
        </button>
        <button
          type="button"
          className={styles.pageButton}
          disabled={currentPage === 1}
          onClick={() => onPage(currentPage - 1)}
        >
          {"<"}
        </button>
        {pages.map((page) => (
          <button
            key={page}
            type="button"
            className={styles.pageButton}
            data-active={page === currentPage ? "true" : "false"}
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
          {">"}
        </button>
        <button
          type="button"
          className={styles.pageButton}
          disabled={currentPage >= total}
          onClick={() => onPage(total)}
        >
          {">>"}
        </button>
      </div>
    </div>
  );
}
