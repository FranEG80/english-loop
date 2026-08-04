import type { D1DatabaseLike } from "../types/binding";
import { statement } from "./shared";
import { DEMO_DAILY_GOAL_ACTIVITIES, DEMO_USER_EMAIL, DEMO_USER_ID, DEMO_USER_NAME } from "@/core/content/domain/demo-fixture";

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
  ];
}
