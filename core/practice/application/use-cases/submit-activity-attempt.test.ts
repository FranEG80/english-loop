import { describe, expect, it } from "vitest";
import { activity, actor, clock, identity, ids, MemoryAttempts, MemoryRuns } from "@/test/support/core-fakes";
import { PracticeRun } from "../../domain/practice-run";
import { submitActivityAttempt } from "./submit-activity-attempt";

describe("submitActivityAttempt", () => {
  it("uses the version pinned by the run instead of the active activity", async () => {
    const runs = new MemoryRuns();
    const run = PracticeRun.create({ id: "versioned-submit", userId: actor.userId, mode: "FOCUSED", scope: { level: "B1", taxonomyNodeId: "topic", taxonomyPath: [], descendantIds: ["topic"], requestedCount: 1 }, activityIds: ["activity-1"], activityVersionIds: ["activity-1-v1"], currentIndex: 0, status: "in_progress", datasetVersion: "v1", dailySessionId: null, createdAt: clock.nowIso() });
    await runs.save(run);
    const catalog = {
      getActivityById: async () => ({ ...activity("activity-1"), versionId: "activity-1-v2", evaluator: { strategy: "boolean" as const, correct: true } }),
      getActivityByVersionId: async () => ({ ...activity("activity-1"), versionId: "activity-1-v1", evaluator: { strategy: "boolean" as const, correct: false } }),
      listActivities: async () => [],
      countActivitiesByNode: async () => 1,
      countActivitiesByNodes: async () => 1,
    };
    const result = await submitActivityAttempt(identity, new MemoryAttempts(), runs, catalog, ids, clock, "1.0.0", { runId: run.id, activityId: "activity-1", idempotencyKey: "versioned-submit-key", response: { kind: "boolean", value: true } });
    expect(result.attempt.isCorrect).toBe(false);
    expect(result.attempt.activityVersionId).toBe("activity-1-v1");
  });

  it("uses the run snapshot when its pinned version is unavailable in the current catalog", async () => {
    const runs = new MemoryRuns();
    const snapshot = {
      ...activity("activity-1"),
      versionId: "database-version",
      evaluator: { strategy: "boolean" as const, correct: false },
    };
    const run = PracticeRun.create({
      id: "snapshot-submit",
      userId: actor.userId,
      mode: "FOCUSED",
      scope: { level: "B1", taxonomyNodeId: "topic", taxonomyPath: [], descendantIds: ["topic"], requestedCount: 1 },
      activityIds: ["activity-1"],
      activityVersionIds: ["database-version"],
      activitySnapshots: [snapshot],
      currentIndex: 0,
      status: "in_progress",
      datasetVersion: "v1",
      dailySessionId: null,
      createdAt: clock.nowIso(),
    });
    await runs.save(run);
    const catalog = {
      getActivityById: async () => null,
      getActivityByVersionId: async () => null,
      listActivities: async () => [],
      countActivitiesByNode: async () => 1,
      countActivitiesByNodes: async () => 1,
    };

    const result = await submitActivityAttempt(
      identity,
      new MemoryAttempts(),
      runs,
      catalog,
      ids,
      clock,
      "1.0.0",
      { runId: run.id, activityId: "activity-1", idempotencyKey: "snapshot-key", response: { kind: "boolean", value: true } },
    );

    expect(result.attempt.isCorrect).toBe(false);
    expect(result.attempt.activityVersionId).toBe("database-version");
  });

  it("evaluates, persists and returns the same attempt on retry", async () => {
    const runs = new MemoryRuns();
    const attempts = new MemoryAttempts();
    const run = PracticeRun.create({ id: "submit", userId: actor.userId, mode: "FOCUSED", scope: { level: "B1", taxonomyNodeId: "topic", taxonomyPath: [], descendantIds: ["topic"], requestedCount: 5 }, activityIds: ["activity-1"], currentIndex: 0, status: "in_progress", datasetVersion: "v1", dailySessionId: null, createdAt: clock.nowIso() });
    await runs.save(run);
    const catalog = { getActivityById: async () => activity("activity-1"), listActivities: async () => [], countActivitiesByNode: async () => 1, countActivitiesByNodes: async () => 1 };
    const input = { runId: run.id, activityId: "activity-1", idempotencyKey: "same", response: { kind: "boolean" as const, value: true } };
    const first = await submitActivityAttempt(identity, attempts, runs, catalog, ids, clock, "1.0.0", input);
    const second = await submitActivityAttempt(identity, attempts, runs, catalog, ids, clock, "1.0.0", input);
    expect(first.attempt.isCorrect).toBe(true);
    expect(first.runCompleted).toBe(true);
    expect(second.attempt.id).toBe(first.attempt.id);
    expect(attempts.values).toHaveLength(1);
  });

  it("rejects missing runs, foreign runs, missing activities and conflicting idempotency keys", async () => {
    const attempts = new MemoryAttempts();
    const runs = new MemoryRuns();
    const catalog = { getActivityById: async () => activity("activity-1"), listActivities: async () => [], countActivitiesByNode: async () => 1, countActivitiesByNodes: async () => 1 };
    const input = { runId: "missing", activityId: "activity-1", idempotencyKey: "key", response: { kind: "boolean" as const, value: true } };
    await expect(submitActivityAttempt(identity, attempts, runs, catalog, ids, clock, "1.0.0", input)).rejects.toMatchObject({ message: "Practice run not found: missing" });

    const foreign = PracticeRun.create({ id: "foreign", userId: "someone-else", mode: "FOCUSED", scope: { level: "B1", taxonomyNodeId: "topic", taxonomyPath: [], descendantIds: ["topic"], requestedCount: 1 }, activityIds: ["activity-1"], currentIndex: 0, status: "in_progress", datasetVersion: "v1", dailySessionId: null, createdAt: clock.nowIso() });
    await runs.save(foreign);
    await expect(submitActivityAttempt(identity, attempts, runs, catalog, ids, clock, "1.0.0", { ...input, runId: "foreign", idempotencyKey: "foreign" })).rejects.toMatchObject({ message: "Cannot access another user's practice run" });

    const mine = PracticeRun.create({ id: "mine", userId: actor.userId, mode: "FOCUSED", scope: { level: "B1", taxonomyNodeId: "topic", taxonomyPath: [], descendantIds: ["topic"], requestedCount: 1 }, activityIds: ["activity-1"], currentIndex: 0, status: "in_progress", datasetVersion: "v1", dailySessionId: null, createdAt: clock.nowIso() });
    await runs.save(mine);
    const missingCatalog = { ...catalog, getActivityById: async () => null };
    await expect(submitActivityAttempt(identity, attempts, runs, missingCatalog, ids, clock, "1.0.0", { ...input, runId: "mine", idempotencyKey: "missing-activity" })).rejects.toMatchObject({ message: "Activity not found: activity-1" });

    const existing = await submitActivityAttempt(identity, attempts, runs, catalog, ids, clock, "1.0.0", { ...input, runId: "mine", idempotencyKey: "conflict" });
    await expect(submitActivityAttempt(identity, attempts, runs, catalog, ids, clock, "1.0.0", { ...input, runId: "mine", activityId: "different", idempotencyKey: "conflict" })).rejects.toMatchObject({ message: "Idempotency key reused with a different payload" });
    expect(existing.attempt.id).toBeDefined();
  });

  it("schedules one failed original attempt but never recursively schedules its repetition", async () => {
    const catalog = { getActivityById: async () => activity("activity-1"), listActivities: async () => [], countActivitiesByNode: async () => 1, countActivitiesByNodes: async () => 1 };
    const originalRuns = new MemoryRuns();
    const original = PracticeRun.create({ id: "original", userId: actor.userId, mode: "FOCUSED", scope: { level: "B1", taxonomyNodeId: "topic", taxonomyPath: [], descendantIds: ["topic"], requestedCount: 1 }, activityIds: ["activity-1"], currentIndex: 0, status: "in_progress", datasetVersion: "v1", dailySessionId: null, createdAt: clock.nowIso() });
    await originalRuns.save(original);
    const originalResult = await submitActivityAttempt(identity, new MemoryAttempts(), originalRuns, catalog, ids, clock, "1.0.0", { runId: "original", activityId: "activity-1", idempotencyKey: "original-fail", response: { kind: "boolean", value: false } });
    expect(originalResult.runCompleted).toBe(false);
    expect(original.activityIds).toEqual(["activity-1", "activity-1"]);

    const repetitionRuns = new MemoryRuns();
    const repetition = PracticeRun.create({ id: "repetition", userId: actor.userId, mode: "FOCUSED", scope: { level: "B1", taxonomyNodeId: "topic", taxonomyPath: [], descendantIds: ["topic"], requestedCount: 1 }, activityIds: ["activity-1", "activity-1"], repetitionActivityIds: ["activity-1"], originalActivityCount: 1, currentIndex: 1, status: "in_progress", datasetVersion: "v1", dailySessionId: null, createdAt: clock.nowIso() });
    await repetitionRuns.save(repetition);
    const repetitionResult = await submitActivityAttempt(identity, new MemoryAttempts(), repetitionRuns, catalog, ids, clock, "1.0.0", { runId: "repetition", activityId: "activity-1", idempotencyKey: "repetition-fail", response: { kind: "boolean", value: false } });
    expect(repetitionResult.runCompleted).toBe(true);
    expect(repetition.activityIds).toHaveLength(2);
  });
});
