import type { D1DatabaseLike } from "../types/binding";
import { statement } from "./shared";
import { DEMO_DAILY_GOAL_ACTIVITIES, DEMO_PROGRESS_ACTIVITY_LIMIT, DEMO_USER_EMAIL, DEMO_USER_ID, DEMO_USER_NAME } from "@/core/content/domain/demo-fixture";

/** Idempotent fixture owned by the public, read-only demo experience. */
export function demoAccountStatements(database: D1DatabaseLike) {
  return [
    statement(database, `INSERT INTO User (id, name, email, emailVerified, isDemo, createdAt, updatedAt)
      VALUES (?, ?, ?, 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(email) DO UPDATE SET
        name = excluded.name,
        emailVerified = 1,
        isDemo = 1,
        updatedAt = CURRENT_TIMESTAMP`, [DEMO_USER_ID, DEMO_USER_NAME, DEMO_USER_EMAIL]),
    statement(database, `INSERT INTO UserSettings
      (id, userId, locale, activeLevels, dailyGoalLessons, dailyGoalActivities, timezone, reducedMotion, createdAt, updatedAt)
      SELECT lower(hex(randomblob(16))), id, 'es', ?, 1, ?, 'UTC', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      FROM User WHERE email = ?
      ON CONFLICT(userId) DO UPDATE SET
        locale = excluded.locale,
        activeLevels = excluded.activeLevels,
        dailyGoalLessons = excluded.dailyGoalLessons,
        dailyGoalActivities = excluded.dailyGoalActivities,
        timezone = excluded.timezone,
        reducedMotion = excluded.reducedMotion,
        updatedAt = CURRENT_TIMESTAMP`, [JSON.stringify(["B1", "B2"]), DEMO_DAILY_GOAL_ACTIVITIES, DEMO_USER_EMAIL]),
    statement(database, "DELETE FROM UserLessonProgress WHERE userId = ?", [DEMO_USER_ID]),
    statement(database, `INSERT INTO UserLessonProgress (id, userId, lessonId, viewed, viewedAt, errorsPending, updatedAt)
      SELECT lower(hex(randomblob(16))), ?, id, 1, '2026-07-01T09:00:00.000Z', 0, CURRENT_TIMESTAMP
      FROM Lesson WHERE isDemo = 1`, [DEMO_USER_ID]),
    statement(database, "DELETE FROM UserActivityProgress WHERE userId = ?", [DEMO_USER_ID]),
    statement(database, `INSERT INTO UserActivityProgress
      (id, userId, activityId, attemptsCount, correctCount, lastResult, lastAttemptAt, updatedAt)
      SELECT lower(hex(randomblob(16))), ?, id, 1,
        CASE WHEN (row_number() OVER (ORDER BY id) - 1) % 5 = 0 THEN 0 ELSE 1 END,
        CASE WHEN (row_number() OVER (ORDER BY id) - 1) % 5 = 0 THEN 0 ELSE 1 END,
        '2026-07-02T09:00:00.000Z', CURRENT_TIMESTAMP
      FROM Activity WHERE isDemo = 1 ORDER BY id LIMIT ?`, [DEMO_USER_ID, DEMO_PROGRESS_ACTIVITY_LIMIT]),
  ];
}
