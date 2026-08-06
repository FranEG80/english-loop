/**
 * Divide una búsqueda humana en términos estables para que espacios, guiones,
 * guiones bajos y tildes no conviertan los IDs del catálogo en invisibles.
 */
export function catalogSearchTerms(query?: string): string[] {
  if (!query?.trim()) return [];
  return [
    ...new Set(
      query
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLocaleLowerCase("en")
        .split(/[^a-z0-9]+/)
        .filter(Boolean),
    ),
  ];
}

export function matchesCatalogSearch(
  values: Array<string | undefined>,
  query?: string,
): boolean {
  const terms = catalogSearchTerms(query);
  if (terms.length === 0) return true;
  const searchable = values
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en")
    .replace(/[^a-z0-9]+/g, " ");
  return terms.every((term) => searchable.includes(term));
}

export function numberedPage<TItem>(
  items: TItem[],
  total: number,
  page: number,
  pageSize: number,
) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return {
    items,
    page,
    pageSize,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

export function assertNumberedPagination(page: number, pageSize: number): void {
  if (!Number.isSafeInteger(page) || page < 1) {
    throw new RangeError("Page must be a positive integer");
  }
  if (!Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > 100) {
    throw new RangeError("Page size must be an integer between 1 and 100");
  }
}
