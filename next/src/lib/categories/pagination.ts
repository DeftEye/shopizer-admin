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
