import { describe, expect, it } from "vitest";
import type { D1DatabaseLike, D1PreparedStatement } from "../types/binding";
import type { D1Operation } from "../types/operations";
import { prepareCompositeD1Operation, prepareD1Operation } from "./index";
import { d1Value } from "./values";
import { operation } from "./request";

function database() {
  const queries: string[] = [];
  const database: D1DatabaseLike = {
    prepare(query) {
      queries.push(query);
      const prepared: D1PreparedStatement = {
        bind: () => prepared,
        first: async () => null,
        all: async () => ({ success: true, results: [] }),
        run: async () => ({ success: true, results: [], meta: { changes: 1 } }),
      };
      return prepared;
    },
    batch: async () => [],
  };
  return { database, queries };
}

const settings = {
  userId: "user-1",
  locale: "en",
  activeLevels: "B1",
  dailyGoalLessons: 5,
  dailyGoalActivities: 10,
  timezone: "Europe/Madrid",
  reducedMotion: false,
};

const dailySession = {
  id: "session-1",
  userId: "user-1",
  date: "2026-08-04",
  status: "IN_PROGRESS",
  datasetVersion: "1.0.0",
  seed: "seed-1",
  practiceRunId: null,
  createdAt: "2026-08-04T00:00:00.000Z",
  lessons: [{ lessonId: "lesson-1", order: 0, status: "PENDING", selectionReason: "new", completedAt: null }],
};

const practiceRun = {
  id: "run-1",
  userId: "user-1",
  mode: "FOCUSED",
  status: "IN_PROGRESS",
  scopeSnapshot: "{}",
  currentIndex: 0,
  originalActivityCount: 1,
  datasetVersion: "1.0.0",
  createdAt: "2026-08-04T00:00:00.000Z",
  items: [{ position: 0, lessonId: "lesson-1", activityId: "activity-1", activityVersionId: null, activitySnapshot: null, origin: "FOCUSED", status: "PENDING", isRepetition: false, repetitionOfItemId: null }],
};

const query = {
  model: "user" as const,
  where: [
    { field: "email", value: "user@example.com", operator: "eq" as const },
    { field: "name", value: "name", operator: "ne" as const, connector: "OR" as const },
    { field: "createdAt", value: "2026-01-01", operator: "lt" as const },
    { field: "updatedAt", value: "2026-01-01", operator: "lte" as const },
    { field: "id", value: "user-1", operator: "gt" as const },
    { field: "id", value: "user-1", operator: "gte" as const },
    { field: "id", value: ["user-1", "user-2"], operator: "in" as const },
    { field: "id", value: ["user-3"], operator: "not_in" as const },
    { field: "name", value: "part", operator: "contains" as const },
    { field: "name", value: "prefix", operator: "starts_with" as const },
    { field: "name", value: "suffix", operator: "ends_with" as const },
  ],
  limit: 10,
  offset: 2,
  sortBy: { field: "createdAt", direction: "desc" as const },
  select: ["id", "email"],
};

function regularOperations(): D1Operation[] {
  return [
    { name: "health" }, { name: "activeCatalogMetadata" },
    { name: "activityById", activityId: "activity-1" },
    { name: "activityByVersionId", activityVersionId: "activity-version-1" },
    { name: "catalogLessons", level: "B1", category: "grammar" },
    { name: "catalogActivities", taxonomyNodeId: "node-1", level: "B1", lessonIds: ["lesson-1"] },
    { name: "catalogTaxonomy" },
    { name: "catalogCounts", kind: "lessons" }, { name: "catalogCounts", kind: "activities" }, { name: "catalogCounts", kind: "taxonomy" },
    { name: "userSettingsGet", userId: "user-1" }, { name: "userSettingsSave", snapshot: settings },
    { name: "savedLessonsList", userId: "user-1" }, { name: "savedLessonGet", userId: "user-1", lessonId: "lesson-1" },
    { name: "savedLessonSave", snapshot: { userId: "user-1", lessonId: "lesson-1", savedAt: "2026-08-04T00:00:00.000Z" } },
    { name: "savedLessonDelete", userId: "user-1", lessonId: "lesson-1" },
    { name: "dailySessionGetById", sessionId: "session-1" },
    { name: "dailySessionGetByUserDate", userId: "user-1", date: "2026-08-04" },
    { name: "dailySessionGetByPracticeRun", practiceRunId: "run-1" },
    { name: "lessonProgressList", userId: "user-1" },
    { name: "lessonProgressSave", snapshot: { userId: "user-1", lessonId: "lesson-1", viewed: true, viewedAt: "2026-08-04T00:00:00.000Z", errorsPending: 0 } },
    { name: "practiceRunGet", runId: "run-1" },
    { name: "attemptGetByIdempotency", userId: "user-1", idempotencyKey: "key-1" },
    { name: "attemptsGetByRun", practiceRunId: "run-1" },
    { name: "attemptsGetByUserActivity", userId: "user-1", activityId: "activity-1", limit: 10 },
    { name: "attemptSave", snapshot: { id: "attempt-1", userId: "user-1", practiceRunId: "run-1", activityId: "activity-1", activityVersionId: null, practiceRunItemId: null, origin: "FOCUSED", idempotencyKey: "key-1", response: "answer", isCorrect: true, isRepetition: false, evaluatorVersion: "1", submittedAt: "2026-08-04T00:00:00.000Z" } },
    { name: "activityProgressGet", userId: "user-1", activityId: "activity-1" },
    { name: "activityProgressSave", snapshot: { userId: "user-1", activityId: "activity-1", attemptsCount: 1, correctCount: 1, lastResult: true, lastAttemptAt: "2026-08-04T00:00:00.000Z" } },
    { name: "taxonomyProgressGet", userId: "user-1", taxonomyNodeId: "node-1" },
    { name: "taxonomyProgressSave", snapshot: { userId: "user-1", taxonomyNodeId: "node-1", attemptsCount: 1, correctCount: 1 } },
    { name: "progressOverview", userId: "user-1" },
    { name: "reviewGetByActivity", userId: "user-1", activityId: "activity-1" },
    { name: "reviewGetDue", userId: "user-1", nowIso: "2026-08-04T00:00:00.000Z" },
    { name: "reviewGetUpcoming", userId: "user-1", nowIso: "2026-08-04T00:00:00.000Z", limit: 10 },
    { name: "reviewSave", snapshot: { id: "review-1", userId: "user-1", activityId: "activity-1", activityVersionId: null, lessonId: "lesson-1", taxonomyNodeId: "node-1", level: "B1", stage: 1, consecutiveCorrect: 0, dueAt: "2026-08-05T00:00:00.000Z", failedAt: "2026-08-04T00:00:00.000Z", resolvedAt: null, attemptsCount: 1 } },
    { name: "rateLimitConsume", snapshot: { key: "attempt:user-1", nowIso: "2026-08-04T00:00:00.000Z", resetAtIso: "2026-08-04T01:00:00.000Z", max: 10 } },
    { name: "consumeVerification", identifier: "user@example.com", value: "code", nowIso: "2026-08-04T00:00:00.000Z" },
    { name: "acceptReplayNonce", nonce: "nonce-1", nowIso: "2026-08-04T00:00:00.000Z", expiresAtIso: "2026-08-04T01:00:00.000Z" },
  ];
}

describe("D1 operation SQL dispatch", () => {
  it("prepares every non-composite bounded-context operation", () => {
    const fake = database();
    for (const candidate of regularOperations()) {
      const prepared = prepareD1Operation(fake.database, candidate);
      expect(prepared.statement).toBeDefined();
    }
    prepareD1Operation(fake.database, { name: "catalogLessons" });
    prepareD1Operation(fake.database, { name: "catalogActivities" });
    prepareD1Operation(fake.database, { name: "catalogActivities", level: "both" });
    expect(fake.queries.length).toBe(41);
  });

  it("adds keyset predicates and limits only to paginated catalog reads", () => {
    const fake = database();
    prepareD1Operation(fake.database, { name: "catalogLessons", cursor: "lesson-1", limit: 3 });
    prepareD1Operation(fake.database, { name: "catalogLessons", limit: 3 });
    prepareD1Operation(fake.database, { name: "catalogActivities", cursor: "activity-1", limit: 3 });
    prepareD1Operation(fake.database, { name: "catalogActivities", limit: 3 });
    expect(fake.queries.filter((query) => query.includes("LIMIT ?"))).toHaveLength(4);
    expect(fake.queries.filter((query) => query.includes("lessonId > ?"))).toHaveLength(2);
    expect(fake.queries.filter((query) => query.includes("activityId > ?"))).toHaveLength(2);
  });

  it("prepares composite daily and practice snapshots with their child rows", () => {
    const fake = database();
    expect(prepareCompositeD1Operation(fake.database, { name: "dailySessionSave", snapshot: dailySession })).toHaveLength(3);
    expect(prepareCompositeD1Operation(fake.database, { name: "practiceRunSave", snapshot: practiceRun })).toHaveLength(3);
    expect(fake.queries[5]).toContain("cr.datasetVersion");
    expect(prepareCompositeD1Operation(fake.database, { name: "dailySessionSave", snapshot: { ...dailySession, lessons: [] } })).toHaveLength(2);
    expect(prepareCompositeD1Operation(fake.database, { name: "practiceRunSave", snapshot: { ...practiceRun, items: [] } })).toHaveLength(2);
  });

  it("covers Better Auth query variants while keeping fields allowlisted", () => {
    const fake = database();
    const queries: D1Operation[] = [
      { name: "authCreate", model: "user", data: { id: "user-1", email: "user@example.com", isDemo: true }, select: ["id", "isDemo"] },
      { name: "authCreate", model: "session", data: {} },
      { name: "authFindOne", query }, { name: "authFindMany", query }, { name: "authCount", query },
      { name: "authDelete", query }, { name: "authDeleteMany", query }, { name: "authConsumeOne", query },
      { name: "authUpdate", query, update: { name: "Updated" } },
      { name: "authUpdateMany", query, update: { name: "Updated" } },
      { name: "authIncrementOne", query, increment: { emailVerified: 1 }, set: { name: "Updated" } },
    ];
    for (const candidate of queries) expect(prepareD1Operation(fake.database, candidate).statement).toBeDefined();
    expect(() => prepareD1Operation(fake.database, { name: "authFindOne", query: { model: "user", where: [{ field: "notAllowed", value: "x" }] } })).toThrow("Unsupported Better Auth field");
  });

  it("covers empty and default Better Auth predicates, pagination and updates", () => {
    const fake = database();
    const edgeQuery = {
      model: "user" as const,
      where: [
        { field: "email", value: "user@example.com" },
        { field: "id", value: [], operator: "in" as const, connector: "AND" as const },
        { field: "id", value: [], operator: "not_in" as const, connector: "OR" as const },
        { field: "id", value: ["user-1"], operator: "eq" as const, connector: "AND" as const },
      ],
      sortBy: { field: "createdAt", direction: "asc" as const },
    };
    expect(prepareD1Operation(fake.database, { name: "authFindMany", query: edgeQuery }).statement).toBeDefined();
    expect(prepareD1Operation(fake.database, { name: "authFindOne", query: { model: "user", where: undefined, select: [] } }).statement).toBeDefined();
    expect(prepareD1Operation(fake.database, { name: "authFindMany", query: { model: "user", where: [] } }).statement).toBeDefined();
    expect(prepareD1Operation(fake.database, { name: "authIncrementOne", query: { model: "user", where: [] }, increment: { emailVerified: 1 } }).statement).toBeDefined();
    expect(() => prepareD1Operation(fake.database, { name: "authUpdateMany", query: { model: "user", where: [] }, update: { unsupported: "x" } })).toThrow("Unsupported Better Auth field");
  });

  it("keeps operation construction and D1 value binding explicit", () => {
    expect(operation({ name: "health" })).toEqual({ name: "health" });
    expect(d1Value(null)).toBeNull();
    expect(d1Value("text")).toBe("text");
    expect(d1Value(1)).toBe(1);
    expect(d1Value(true)).toBe(true);
    expect(d1Value(new ArrayBuffer(1))).toBeInstanceOf(ArrayBuffer);
    expect(d1Value(new Uint8Array([1]))).toBeInstanceOf(Uint8Array);
    expect(() => d1Value({ unsupported: true })).toThrow("D1 parameters must be scalar values");
  });

  it("binds nullable and boolean persistence values on both sides", () => {
    const fake = database();
    expect(prepareD1Operation(fake.database, {
      name: "attemptSave",
      snapshot: { id: "attempt-2", userId: "user-1", practiceRunId: null, activityId: "activity-1", activityVersionId: "version-1", practiceRunItemId: "run-1:0", origin: "FOCUSED", idempotencyKey: "key-2", response: "answer", isCorrect: false, isRepetition: true, evaluatorVersion: "v1", submittedAt: "2026-08-04T00:00:00.000Z" },
    }).statement).toBeDefined();
    expect(prepareD1Operation(fake.database, {
      name: "userSettingsSave",
      snapshot: { ...settings, reducedMotion: true },
    }).statement).toBeDefined();
    expect(prepareD1Operation(fake.database, {
      name: "activityProgressSave",
      snapshot: { userId: "user-1", activityId: "activity-1", attemptsCount: 2, correctCount: 0, lastResult: false, lastAttemptAt: null },
    }).statement).toBeDefined();
    expect(prepareCompositeD1Operation(fake.database, {
      name: "practiceRunSave",
      snapshot: { ...practiceRun, items: [{ ...practiceRun.items[0]!, activityVersionId: "version-1", isRepetition: true, repetitionOfItemId: "run-1:0" }] },
    }).length).toBe(3);
  });
});
