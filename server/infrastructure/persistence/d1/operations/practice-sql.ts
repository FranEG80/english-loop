import type { D1DatabaseLike } from "../types/binding";
import type { D1Operation } from "../types/operations";
import { bind, type PreparedOperation } from "./shared";

type PracticeOperation = Extract<D1Operation, { name: "practiceRunGet" | "attemptGetByIdempotency" | "attemptsGetByRun" | "attemptsGetByUserActivity" | "attemptSave" }>;

export function preparePracticeOperation(database: D1DatabaseLike, operation: PracticeOperation): PreparedOperation {
  switch (operation.name) {
    case "practiceRunGet":
      return bind(database, `SELECT r.id, r.userId, r.mode, r.status, r.scopeSnapshot,
          r.currentIndex, r.originalActivityCount, r.datasetVersion, r.createdAt,
          i.position, i.lessonId, i.activityId, i.activityVersionId, i.origin,
          i.activitySnapshot, i.status AS itemStatus, i.isRepetition, i.repetitionOfItemId
        FROM PracticeRun r LEFT JOIN PracticeRunItem i ON i.practiceRunId = r.id
        WHERE r.id = ? ORDER BY i.position ASC`, [operation.runId]);
    case "attemptGetByIdempotency":
      return bind(database, `SELECT id, userId, practiceRunId, activityId, activityVersionId,
          practiceRunItemId, origin, idempotencyKey, response, isCorrect, isRepetition,
          evaluatorVersion, submittedAt FROM ActivityAttempt WHERE userId = ? AND idempotencyKey = ?`, [operation.userId, operation.idempotencyKey]);
    case "attemptsGetByRun":
      return bind(database, `SELECT id, userId, practiceRunId, activityId, activityVersionId,
          practiceRunItemId, origin, idempotencyKey, response, isCorrect, isRepetition,
          evaluatorVersion, submittedAt FROM ActivityAttempt WHERE practiceRunId = ? ORDER BY submittedAt ASC`, [operation.practiceRunId]);
    case "attemptsGetByUserActivity":
      return bind(database, `SELECT id, userId, practiceRunId, activityId, activityVersionId,
          practiceRunItemId, origin, idempotencyKey, response, isCorrect, isRepetition,
          evaluatorVersion, submittedAt FROM ActivityAttempt WHERE userId = ? AND activityId = ?
        ORDER BY submittedAt DESC LIMIT ?`, [operation.userId, operation.activityId, operation.limit]);
    case "attemptSave": {
      const s = operation.snapshot;
      return bind(database, `INSERT INTO ActivityAttempt
          (id, userId, practiceRunId, activityId, activityVersionId, practiceRunItemId,
           origin, idempotencyKey, response, isCorrect, isRepetition, evaluatorVersion, submittedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [s.id, s.userId, s.practiceRunId, s.activityId, s.activityVersionId, s.practiceRunItemId,
          s.origin, s.idempotencyKey, s.response, s.isCorrect ? 1 : 0, s.isRepetition ? 1 : 0, s.evaluatorVersion, s.submittedAt], true);
    }
  }
}
