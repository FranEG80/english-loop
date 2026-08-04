import type { D1DatabaseLike } from "../types/binding";
import type { D1Operation } from "../types/operations";
import { bind, type PreparedOperation } from "./shared";

export function prepareCompositeD1Operation(
  database: D1DatabaseLike,
  operation: Extract<D1Operation, { name: "dailySessionSave" | "practiceRunSave" }>,
): PreparedOperation[] {
  if (operation.name === "dailySessionSave") {
    const s = operation.snapshot;
    const statements: PreparedOperation[] = [
      bind(database, `INSERT INTO DailySession
          (id, userId, date, status, datasetVersion, seed, practiceRunId, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET status = excluded.status,
          practiceRunId = excluded.practiceRunId, updatedAt = CURRENT_TIMESTAMP`,
        [s.id, s.userId, s.date, s.status, s.datasetVersion, s.seed, s.practiceRunId, s.createdAt], true),
      bind(database, `DELETE FROM DailySessionLesson WHERE dailySessionId = ?`, [s.id], true),
    ];
    for (const lesson of s.lessons) {
      statements.push(bind(database, `INSERT INTO DailySessionLesson
          (id, dailySessionId, lessonId, "order", status, selectionReason, completedAt)
        VALUES (lower(hex(randomblob(16))), ?, ?, ?, ?, ?, ?)`,
        [`${s.id}:${lesson.order}`, s.id, lesson.lessonId, lesson.order, lesson.status, lesson.selectionReason, lesson.completedAt], true));
    }
    return statements;
  }

  const s = operation.snapshot;
  const statements: PreparedOperation[] = [
    bind(database, `INSERT INTO PracticeRun
        (id, userId, mode, status, scopeSnapshot, currentIndex, originalActivityCount,
         datasetVersion, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET status = excluded.status,
        currentIndex = excluded.currentIndex, originalActivityCount = excluded.originalActivityCount,
        updatedAt = CURRENT_TIMESTAMP`,
      [s.id, s.userId, s.mode, s.status, s.scopeSnapshot, s.currentIndex, s.originalActivityCount, s.datasetVersion, s.createdAt], true),
    bind(database, `DELETE FROM PracticeRunItem WHERE practiceRunId = ?`, [s.id], true),
  ];
  for (const item of s.items) {
    statements.push(bind(database, `INSERT INTO PracticeRunItem
        (id, practiceRunId, position, lessonId, activityId, activityVersionId, origin,
         status, isRepetition, repetitionOfItemId)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [`${s.id}:${item.position}`, s.id, item.position, item.lessonId, item.activityId,
        item.activityVersionId, item.origin, item.status, item.isRepetition ? 1 : 0, item.repetitionOfItemId], true));
  }
  return statements;
}
