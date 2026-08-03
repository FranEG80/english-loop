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
