import type { D1DatabaseLike } from "../types/binding";
import type { D1Operation } from "../types/operations";
import { bind, type PreparedOperation } from "./shared";

type AccountOperation = Extract<D1Operation, { name: "userSettingsGet" | "userSettingsSave" | "savedLessonsList" | "savedLessonGet" | "savedLessonSave" | "savedLessonDelete" }>;

export function prepareAccountOperation(database: D1DatabaseLike, operation: AccountOperation): PreparedOperation {
  switch (operation.name) {
    case "userSettingsGet":
      return bind(database, `SELECT userId, locale, activeLevels, dailyGoalLessons,
          dailyGoalActivities, timezone, reducedMotion FROM UserSettings WHERE userId = ?`, [operation.userId]);
    case "userSettingsSave": {
      const s = operation.snapshot;
      return bind(database, `INSERT INTO UserSettings
          (id, userId, locale, activeLevels, dailyGoalLessons, dailyGoalActivities,
           timezone, reducedMotion, createdAt, updatedAt)
        VALUES (lower(hex(randomblob(16))), ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT(userId) DO UPDATE SET locale = excluded.locale,
          activeLevels = excluded.activeLevels, dailyGoalLessons = excluded.dailyGoalLessons,
          dailyGoalActivities = excluded.dailyGoalActivities, timezone = excluded.timezone,
          reducedMotion = excluded.reducedMotion, updatedAt = CURRENT_TIMESTAMP`,
        [s.userId, s.locale, s.activeLevels, s.dailyGoalLessons, s.dailyGoalActivities, s.timezone, s.reducedMotion ? 1 : 0], true);
    }
    case "savedLessonsList":
      return bind(database, `SELECT userId, lessonId, savedAt FROM SavedLesson WHERE userId = ? ORDER BY savedAt DESC`, [operation.userId]);
    case "savedLessonGet":
      return bind(database, `SELECT userId, lessonId, savedAt FROM SavedLesson WHERE userId = ? AND lessonId = ?`, [operation.userId, operation.lessonId]);
    case "savedLessonSave": {
      const s = operation.snapshot;
      return bind(database, `INSERT INTO SavedLesson (id, userId, lessonId, savedAt)
        VALUES (lower(hex(randomblob(16))), ?, ?, ?) ON CONFLICT(userId, lessonId) DO NOTHING`, [s.userId, s.lessonId, s.savedAt], true);
    }
    case "savedLessonDelete":
      return bind(database, `DELETE FROM SavedLesson WHERE userId = ? AND lessonId = ?`, [operation.userId, operation.lessonId], true);
  }
}
