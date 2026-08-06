/** Paginación por cursor para listados. */
export interface CursorPage<TItem> {
  items: TItem[];
  /** Cursor para la siguiente página; `null` si no hay más. */
  nextCursor: string | null;
  hasMore: boolean;
}

export interface CursorPaginationParams {
  /** Cursor opaco devuelto por la página anterior. */
  cursor?: string;
  limit: number;
}

/** Página numerada para catálogos navegables y búsquedas con total real. */
export interface NumberedPage<TItem> {
  items: TItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface NumberedPaginationParams {
  page: number;
  pageSize: number;
}
