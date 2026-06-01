/** Límite habitual del backend en listados paginados (`pageSize`). */
export const API_MAX_PAGE_SIZE = 100;

export async function fetchAllPaginatedItems<T>(
  fetchPage: (page: number, pageSize: number) => Promise<{ items: T[]; total: number }>
): Promise<T[]> {
  const first = await fetchPage(1, API_MAX_PAGE_SIZE);
  if (first.items.length >= first.total) return first.items;

  const totalPages = Math.ceil(first.total / API_MAX_PAGE_SIZE);
  const rest = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) =>
      fetchPage(index + 2, API_MAX_PAGE_SIZE)
    )
  );
  return [...first.items, ...rest.flatMap((page) => page.items)];
}
