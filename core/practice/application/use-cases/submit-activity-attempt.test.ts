import { describe, expect, it } from "vitest";
import { activity, actor, clock, identity, ids, MemoryAttempts, MemoryRuns } from "@/test/support/core-fakes";
import { PracticeRun } from "../../domain/practice-run";
import { submitActivityAttempt } from "./submit-activity-attempt";

describe("submitActivityAttempt", () => {
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
});
