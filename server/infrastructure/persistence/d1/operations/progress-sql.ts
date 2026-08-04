import type { D1DatabaseLike } from "../types/binding";
import type { D1Operation } from "../types/operations";
import { bind, type PreparedOperation } from "./shared";

type ProgressOperation = Extract<D1Operation, { name: "activityProgressGet" | "activityProgressSave" | "taxonomyProgressGet" | "taxonomyProgressSave" | "progressOverview" | "reviewGetByActivity" | "reviewGetDue" | "reviewGetUpcoming" | "reviewSave" }>;

export function prepareProgressOperation(database: D1DatabaseLike, operation: ProgressOperation): PreparedOperation {
  switch (operation.name) {
    case "activityProgressGet":
      return bind(database, `SELECT userId, activityId, attemptsCount, correctCount, lastResult, lastAttemptAt
        FROM UserActivityProgress WHERE userId = ? AND activityId = ?`, [operation.userId, operation.activityId]);
    case "activityProgressSave": {
      const s = operation.snapshot;
      return bind(database, `INSERT INTO UserActivityProgress
          (id, userId, activityId, attemptsCount, correctCount, lastResult, lastAttemptAt, updatedAt)
        VALUES (lower(hex(randomblob(16))), ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(userId, activityId) DO UPDATE SET attemptsCount = excluded.attemptsCount,
          correctCount = excluded.correctCount, lastResult = excluded.lastResult,
          lastAttemptAt = excluded.lastAttemptAt, updatedAt = CURRENT_TIMESTAMP`,
        [s.userId, s.activityId, s.attemptsCount, s.correctCount, s.lastResult === null ? null : s.lastResult ? 1 : 0, s.lastAttemptAt], true);
    }
    case "taxonomyProgressGet":
      return bind(database, `SELECT userId, taxonomyNodeId, attemptsCount, correctCount FROM TaxonomyProgress WHERE userId = ? AND taxonomyNodeId = ?`, [operation.userId, operation.taxonomyNodeId]);
    case "taxonomyProgressSave": {
      const s = operation.snapshot;
      return bind(database, `INSERT INTO TaxonomyProgress
          (id, userId, taxonomyNodeId, attemptsCount, correctCount, updatedAt)
        VALUES (lower(hex(randomblob(16))), ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(userId, taxonomyNodeId) DO UPDATE SET attemptsCount = excluded.attemptsCount,
          correctCount = excluded.correctCount, updatedAt = CURRENT_TIMESTAMP`, [s.userId, s.taxonomyNodeId, s.attemptsCount, s.correctCount], true);
    }
    case "progressOverview":
      return bind(database, `SELECT 'activity' AS kind, activityId AS itemId, attemptsCount, correctCount, lastResult, lastAttemptAt
        FROM UserActivityProgress WHERE userId = ? UNION ALL
        SELECT 'taxonomy' AS kind, taxonomyNodeId AS itemId, attemptsCount, correctCount, NULL, NULL
        FROM TaxonomyProgress WHERE userId = ?`, [operation.userId, operation.userId]);
    case "reviewGetByActivity":
      return bind(database, reviewSelect("userId = ? AND activityId = ? AND resolvedAt IS NULL") + " ORDER BY createdAt DESC LIMIT 1", [operation.userId, operation.activityId]);
    case "reviewGetDue":
      return bind(database, reviewSelect("userId = ? AND resolvedAt IS NULL AND dueAt <= ?") + " ORDER BY dueAt ASC", [operation.userId, operation.nowIso]);
    case "reviewGetUpcoming":
      return bind(database, reviewSelect("userId = ? AND resolvedAt IS NULL AND dueAt > ?") + " ORDER BY dueAt ASC LIMIT ?", [operation.userId, operation.nowIso, operation.limit]);
    case "reviewSave": {
      const s = operation.snapshot;
      return bind(database, `INSERT INTO ReviewItem
          (id, userId, activityId, activityVersionId, lessonId, taxonomyNodeId, level,
           stage, consecutiveCorrect, dueAt, failedAt, resolvedAt, attemptsCount, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET stage = excluded.stage,
          consecutiveCorrect = excluded.consecutiveCorrect, dueAt = excluded.dueAt,
          resolvedAt = excluded.resolvedAt, attemptsCount = excluded.attemptsCount,
          updatedAt = CURRENT_TIMESTAMP`,
        [s.id, s.userId, s.activityId, s.activityVersionId, s.lessonId, s.taxonomyNodeId, s.level,
          s.stage, s.consecutiveCorrect, s.dueAt, s.failedAt, s.resolvedAt, s.attemptsCount], true);
    }
  }
}

function reviewSelect(predicate: string): string {
  return `SELECT id, userId, activityId, activityVersionId, lessonId, taxonomyNodeId,
    level, stage, consecutiveCorrect, dueAt, failedAt, resolvedAt, attemptsCount
    FROM ReviewItem WHERE ${predicate}`;
}
