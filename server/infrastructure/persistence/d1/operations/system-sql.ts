import type { D1DatabaseLike } from "../types/binding";
import type { D1Operation } from "../types/operations";
import { bind, type PreparedOperation } from "./shared";

export function prepareSystemOperation(database: D1DatabaseLike, operation: Extract<D1Operation, { name: "health" | "activeCatalogMetadata" | "consumeVerification" | "acceptReplayNonce" | "rateLimitConsume" }>): PreparedOperation {
  switch (operation.name) {
    case "health":
      return { statement: database.prepare("SELECT 1 AS ok"), write: false };
    case "activeCatalogMetadata":
      return {
        statement: database.prepare(`SELECT r.datasetVersion, r.checksum
          FROM CatalogPublication p JOIN CatalogRelease r ON r.id = p.releaseId
          WHERE p.id = 'active' AND r.status = 'published'`),
        write: false,
      };
    case "rateLimitConsume": {
      const s = operation.snapshot;
      return bind(database, `INSERT INTO RateLimitBucket (key, count, resetAt, updatedAt)
        VALUES (?, 1, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(key) DO UPDATE SET count = CASE
          WHEN RateLimitBucket.resetAt <= ? THEN 1 ELSE RateLimitBucket.count + 1 END,
          resetAt = CASE WHEN RateLimitBucket.resetAt <= ? THEN excluded.resetAt ELSE RateLimitBucket.resetAt END,
          updatedAt = CURRENT_TIMESTAMP
        WHERE RateLimitBucket.resetAt <= ? OR RateLimitBucket.count < ?`,
        [s.key, s.resetAtIso, s.nowIso, s.nowIso, s.nowIso, s.max], true);
    }
    case "consumeVerification":
      return bind(database, `DELETE FROM Verification
        WHERE identifier = ? AND value = ? AND expiresAt > ?`,
        [operation.identifier, operation.value, operation.nowIso], true);
    case "acceptReplayNonce":
      return bind(database, `INSERT INTO RateLimitBucket (key, count, resetAt, updatedAt)
        VALUES (?, 1, ?, ?)
        ON CONFLICT(key) DO UPDATE SET count = 1, resetAt = excluded.resetAt,
          updatedAt = excluded.updatedAt
        WHERE RateLimitBucket.resetAt <= ?`,
        [`d1:http:nonce:${operation.nonce}`, operation.expiresAtIso, operation.nowIso, operation.nowIso], true);
  }
}
