import type { D1DatabaseLike } from "../types/binding";
import type { D1Operation } from "../types/operations";
import { bind, type PreparedOperation } from "./shared";

type LearningOperation = Extract<D1Operation, { name: "dailySessionGetById" | "dailySessionGetByUserDate" | "dailySessionGetByPracticeRun" | "lessonProgressList" | "lessonProgressSave" }>;

export function prepareLearningOperation(database: D1DatabaseLike, operation: LearningOperation): PreparedOperation {
  switch (operation.name) {
    case "dailySessionGetById":
      return bind(database, dailySessionQuery("s.id = ?"), [operation.sessionId]);
    case "dailySessionGetByUserDate":
      return bind(database, dailySessionQuery("s.userId = ? AND s.date = ?"), [operation.userId, operation.date]);
    case "dailySessionGetByPracticeRun":
      return bind(database, dailySessionQuery("s.practiceRunId = ?"), [operation.practiceRunId]);
    case "lessonProgressList":
      return bind(database, `SELECT userId, lessonId, viewed, viewedAt, errorsPending FROM UserLessonProgress WHERE userId = ?`, [operation.userId]);
    case "lessonProgressSave": {
      const s = operation.snapshot;
      return bind(database, `INSERT INTO UserLessonProgress
          (id, userId, lessonId, viewed, viewedAt, errorsPending, updatedAt)
        VALUES (lower(hex(randomblob(16))), ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(userId, lessonId) DO UPDATE SET viewed = excluded.viewed,
          viewedAt = excluded.viewedAt, errorsPending = excluded.errorsPending,
          updatedAt = CURRENT_TIMESTAMP`, [s.userId, s.lessonId, s.viewed ? 1 : 0, s.viewedAt, s.errorsPending], true);
    }
  }
}

function dailySessionQuery(predicate: string): string {
  return `SELECT s.id, s.userId, s.date, s.status, s.datasetVersion,
      s.seed, s.practiceRunId, s.createdAt, l.lessonId, l."order" AS lessonOrder,
      l.status AS lessonStatus, l.selectionReason, l.completedAt
    FROM DailySession s LEFT JOIN DailySessionLesson l ON l.dailySessionId = s.id
    WHERE ${predicate} ORDER BY l."order" ASC`;
}
