export type PageAction = "onPage" | "onPrev" | "onNext" | "onFirst" | "onLast";

/** Angular `PaginatorComponent` page math (1-based). */
export function nextPage(
  action: PageAction,
  currentPage: number,
  data?: number,
): number {
  switch (action) {
    case "onPage":
      return data ?? currentPage;
    case "onPrev":
      return currentPage - 1;
    case "onNext":
      return currentPage + 1;
    case "onFirst":
      return 1;
    case "onLast":
      return data ?? currentPage;
  }
}

export function pageNumbers(
  currentPage: number,
  count: number,
  perPage: number,
  pagesToShow = 5,
): number[] {
  const total = Math.ceil(count / perPage) || 0;
  const current = currentPage || 1;
  const pages: number[] = [current];
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
