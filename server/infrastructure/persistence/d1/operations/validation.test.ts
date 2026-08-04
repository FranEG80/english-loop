import { describe, expect, it } from "vitest";
import type { D1Operation } from "../types/operations";
import { d1OperationNames, isD1Operation, isD1OperationName } from "./validation";

const snapshot = {
  userId: "u1", locale: "en", activeLevels: "[\"B1\"]", dailyGoalLessons: 1,
  dailyGoalActivities: 10, timezone: "UTC", reducedMotion: false,
};
const authQuery = { model: "user" as const, where: [{ field: "email", value: "u@example.com" }], limit: 10, offset: 0, select: ["id"] };

const validOperations: D1Operation[] = [
  { name: "health" }, { name: "activeCatalogMetadata" }, { name: "catalogTaxonomy" },
  { name: "activityById", activityId: "a1" }, { name: "catalogLessons", level: "B1", category: "grammar" },
  { name: "catalogActivities", taxonomyNodeId: "n1", level: "B1", lessonIds: ["l1"] },
  { name: "catalogCounts", kind: "activities" }, { name: "userSettingsGet", userId: "u1" }, { name: "userSettingsSave", snapshot },
  { name: "savedLessonsList", userId: "u1" }, { name: "savedLessonGet", userId: "u1", lessonId: "l1" },
  { name: "savedLessonSave", snapshot: { userId: "u1", lessonId: "l1", savedAt: "now" } }, { name: "savedLessonDelete", userId: "u1", lessonId: "l1" },
  { name: "dailySessionGetById", sessionId: "s1" }, { name: "dailySessionGetByUserDate", userId: "u1", date: "2026-08-04" }, { name: "dailySessionGetByPracticeRun", practiceRunId: "r1" },
  { name: "dailySessionSave", snapshot: { id: "s1", userId: "u1", date: "2026-08-04", status: "lesson", datasetVersion: "v1", seed: "seed", practiceRunId: null, createdAt: "now", lessons: [] } },
  { name: "practiceRunGet", runId: "r1" }, { name: "practiceRunSave", snapshot: { id: "r1", userId: "u1", mode: "FOCUSED", status: "in_progress", scopeSnapshot: "{}", currentIndex: 0, originalActivityCount: 0, datasetVersion: "v1", createdAt: "now", items: [] } },
  { name: "attemptGetByIdempotency", userId: "u1", idempotencyKey: "k" }, { name: "attemptsGetByRun", practiceRunId: "r1" }, { name: "attemptsGetByUserActivity", userId: "u1", activityId: "a1", limit: 1 },
  { name: "attemptSave", snapshot: { id: "at1", userId: "u1", practiceRunId: null, activityId: "a1", activityVersionId: null, practiceRunItemId: null, origin: "FOCUSED", idempotencyKey: "k", response: "{}", isCorrect: true, isRepetition: false, evaluatorVersion: "v1", submittedAt: "now" } },
  { name: "lessonProgressList", userId: "u1" }, { name: "lessonProgressSave", snapshot: { userId: "u1", lessonId: "l1", viewed: true, viewedAt: null, errorsPending: 0 } },
  { name: "activityProgressGet", userId: "u1", activityId: "a1" }, { name: "activityProgressSave", snapshot: { userId: "u1", activityId: "a1", attemptsCount: 1, correctCount: 1, lastResult: null, lastAttemptAt: null } },
  { name: "taxonomyProgressGet", userId: "u1", taxonomyNodeId: "n1" }, { name: "taxonomyProgressSave", snapshot: { userId: "u1", taxonomyNodeId: "n1", attemptsCount: 1, correctCount: 1 } }, { name: "progressOverview", userId: "u1" },
  { name: "reviewGetByActivity", userId: "u1", activityId: "a1" }, { name: "reviewGetDue", userId: "u1", nowIso: "now" }, { name: "reviewGetUpcoming", userId: "u1", nowIso: "now", limit: 1 },
  { name: "reviewSave", snapshot: { id: "rv1", userId: "u1", activityId: "a1", activityVersionId: null, lessonId: null, taxonomyNodeId: "n1", level: "B1", stage: 0, consecutiveCorrect: 0, dueAt: "now", failedAt: "now", resolvedAt: null, attemptsCount: 1 } },
  { name: "rateLimitConsume", snapshot: { key: "key", nowIso: "now", resetAtIso: "later", max: 1 } },
  { name: "authCreate", model: "user", data: { id: "u1" }, select: ["id"] }, { name: "authFindOne", query: authQuery }, { name: "authFindMany", query: authQuery }, { name: "authCount", query: authQuery },
  { name: "authUpdate", query: authQuery, update: { name: "new" } }, { name: "authUpdateMany", query: authQuery, update: { name: "new" } }, { name: "authDelete", query: authQuery }, { name: "authDeleteMany", query: authQuery }, { name: "authConsumeOne", query: authQuery }, { name: "authIncrementOne", query: authQuery, increment: { emailVerified: 1 }, set: { name: "new" } },
  { name: "consumeVerification", identifier: "id", value: "value", nowIso: "now" }, { name: "acceptReplayNonce", nonce: "nonce", nowIso: "now", expiresAtIso: "later" },
];

describe("D1 operation envelope validation", () => {
  it("accepts every declared operation shape and recognizes names", () => {
    expect(validOperations).toHaveLength(d1OperationNames.length);
    for (const candidate of validOperations) expect(isD1Operation(candidate)).toBe(true);
    expect(isD1OperationName("health")).toBe(true);
    expect(isD1OperationName("not-an-operation")).toBe(false);
  });

  it("rejects malformed common payloads before SQL dispatch", () => {
    const invalid = [
      null, [], {}, { name: "missing" },
      { name: "activityById", activityId: "" },
      { name: "catalogActivities", lessonIds: [1] },
      { name: "catalogCounts", kind: "unknown" },
      { name: "userSettingsGet", userId: "" },
      { name: "userSettingsSave", snapshot: { ...snapshot, reducedMotion: "false" } },
      { name: "dailySessionSave", snapshot: { id: "s1", userId: "u1", date: "now", status: "lesson", datasetVersion: "v1", seed: "s", createdAt: "now", lessons: "not-array" } },
      { name: "practiceRunSave", snapshot: { id: "r1", userId: "u1", mode: "FOCUSED", status: "in_progress", scopeSnapshot: "{}", currentIndex: 0, originalActivityCount: 0, datasetVersion: "v1", createdAt: "now", items: "not-array" } },
      { name: "attemptsGetByUserActivity", userId: "u1", activityId: "a1", limit: 0 },
      { name: "reviewGetUpcoming", userId: "u1", nowIso: "now", limit: -1 },
      { name: "authFindOne", query: { model: "unknown" } },
      { name: "authFindMany", query: { model: "user", where: ["not-record"] } },
      { name: "authCount", query: { model: "user", limit: 0 } },
      { name: "authIncrementOne", query: authQuery, increment: { emailVerified: "one" } },
      { name: "authUpdate", query: authQuery, update: "not-record" },
    ] as unknown[];
    for (const candidate of invalid) expect(isD1Operation(candidate)).toBe(false);
  });
});
