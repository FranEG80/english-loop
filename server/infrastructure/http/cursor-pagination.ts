import "server-only";
import { decodeCursor, type CursorPaginationParams } from "@/core/shared/kernel";
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
