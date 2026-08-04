import type { CursorPage, CursorPaginationParams } from "./types/pagination";

const CURSOR_VERSION = 1;

export class InvalidCursorError extends Error {
  constructor() {
    super("Invalid cursor");
    this.name = "InvalidCursorError";
  }
}

function encodeBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
}

function decodeBase64Url(value: string): string {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  return new TextDecoder().decode(Uint8Array.from(binary, (character) => character.charCodeAt(0)));
}

/** Codifica una clave de ordenación en un cursor opaco versionado. */
export function encodeCursor(key: string): string {
  return encodeBase64Url(JSON.stringify({ version: CURSOR_VERSION, key }));
}

/** Decodifica un cursor; los valores manipulados o de otra versión se rechazan. */
export function decodeCursor(cursor: string): string {
  try {
    const parsed: unknown = JSON.parse(decodeBase64Url(cursor));
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("version" in parsed) ||
      !("key" in parsed) ||
      parsed.version !== CURSOR_VERSION ||
      typeof parsed.key !== "string" ||
      parsed.key.length === 0
    ) {
      throw new InvalidCursorError();
    }
    return parsed.key;
  } catch (error) {
    if (error instanceof InvalidCursorError) throw error;
    throw new InvalidCursorError();
  }
}

/**
 * Construye una página sobre una colección ya ordenada ascendentemente por
 * la clave indicada. Los adaptadores SQL usan la misma semántica mediante
 * `WHERE key > cursor`.
 */
export function paginateSortedItems<TItem>(
  items: TItem[],
  pagination: CursorPaginationParams,
  getKey: (item: TItem) => string,
): CursorPage<TItem> {
  assertCursorPageLimit(pagination.limit);

  const cursorKey = pagination.cursor ? decodeCursor(pagination.cursor) : undefined;
  const start = cursorKey === undefined
    ? 0
    : items.findIndex((item) => getKey(item) > cursorKey);
  const startIndex = start === -1 ? items.length : start;
  const selected = items.slice(startIndex, startIndex + pagination.limit + 1);
  const hasMore = selected.length > pagination.limit;
  const pageItems = hasMore ? selected.slice(0, pagination.limit) : selected;
  const lastItem = pageItems.at(-1);

  return {
    items: pageItems,
    hasMore,
    nextCursor: hasMore && lastItem ? encodeCursor(getKey(lastItem)) : null,
  };
}

export function assertCursorPageLimit(limit: number): void {
  if (!Number.isSafeInteger(limit) || limit <= 0) {
    throw new RangeError("Cursor page limit must be a positive integer");
  }
}
