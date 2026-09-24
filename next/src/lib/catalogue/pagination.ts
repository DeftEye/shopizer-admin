export type PageEvent =
  | { action: "onPage"; data: number }
  | { action: "onPrev"; data?: null }
  | { action: "onNext"; data?: null }
  | { action: "onFirst"; data?: null }
  | { action: "onLast"; data: number };

/** Angular `ProductsListComponent.changePage`. */
export function pageFromEvent(currentPage: number, event: PageEvent): number {
  switch (event.action) {
    case "onPage":
      return event.data;
    case "onPrev":
      return currentPage - 1;
    case "onNext":
      return currentPage + 1;
    case "onFirst":
      return 1;
    case "onLast":
      return event.data;
  }
}

/** Angular `PaginatorComponent.getPages`. */
export function visiblePages(
  currentPage: number,
  count: number,
  perPage: number,
  pagesToShow = 5,
): number[] {
  const total = Math.ceil(count / perPage) || 0;
  const current = currentPage || 1;
  const pages: number[] = [current];
  const times = pagesToShow - 1;
  for (let i = 0; i < times; i += 1) {
    if (pages.length < pagesToShow && Math.min(...pages) > 1) {
      pages.push(Math.min(...pages) - 1);
    }
    if (pages.length < pagesToShow && Math.max(...pages) < total) {
      pages.push(Math.max(...pages) + 1);
    }
  }
  return pages.sort((a, b) => a - b);
}

export function moveItemInArray<T>(items: T[], from: number, to: number): T[] {
  const next = [...items];
  if (
    from < 0 ||
    to < 0 ||
    from >= next.length ||
    to >= next.length ||
    from === to
  ) {
    return next;
  }
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}
