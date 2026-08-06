import "server-only";
import { decodeCursor, type CursorPaginationParams, type NumberedPaginationParams } from "@/core/shared/kernel";
import { ValidationException } from "@/core/shared/exceptions";
import { config } from "@/server/infrastructure/config/config";

export function parsePublicCursorPagination(searchParams: URLSearchParams): CursorPaginationParams {
  const rawLimit = searchParams.get("limit");
  const limit = rawLimit === null ? config.publicPageDefaultLimit : Number(rawLimit);
  if (!Number.isSafeInteger(limit) || limit <= 0 || limit > config.publicPageMaxLimit) {
    throw new ValidationException("Invalid pagination limit", {
      limit: [`Must be an integer between 1 and ${config.publicPageMaxLimit}`],
    });
  }

  const cursor = searchParams.get("cursor") ?? undefined;
  if (cursor) {
    try {
      decodeCursor(cursor);
    } catch {
      throw new ValidationException("Invalid pagination cursor", {
        cursor: ["Must be a cursor returned by a previous page"],
      });
    }
  }

  return { cursor, limit };
}

export function parsePublicNumberedPagination(
  searchParams: URLSearchParams,
): NumberedPaginationParams {
  const rawPage = searchParams.get("page");
  const rawPageSize = searchParams.get("pageSize");
  const page = rawPage === null ? 1 : Number(rawPage);
  const pageSize = rawPageSize === null ? 12 : Number(rawPageSize);
  if (!Number.isSafeInteger(page) || page < 1) {
    throw new ValidationException("Invalid page", {
      page: ["Must be a positive integer"],
    });
  }
  if (
    !Number.isSafeInteger(pageSize) ||
    pageSize < 1 ||
    pageSize > config.publicPageMaxLimit
  ) {
    throw new ValidationException("Invalid page size", {
      pageSize: [`Must be an integer between 1 and ${config.publicPageMaxLimit}`],
    });
  }
  return { page, pageSize };
}
