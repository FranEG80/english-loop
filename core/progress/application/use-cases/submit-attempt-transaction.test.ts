import { describe, expect, it } from "vitest";
import { activity, clock, collectEvents, identity, ids, MemoryAttempts, MemoryProgress, MemoryReviews, MemoryRuns, actor, taxonomy, uow } from "@/test/support/core-fakes";
import { PracticeRun } from "@/core/practice/domain/practice-run";
import { submitAttemptTransaction } from "./submit-attempt-transaction";

describe("submitAttemptTransaction", () => {
  it("persists the attempt, projects progress/review and dispatches the event once", async () => {
    const runRepository = new MemoryRuns();
    const attemptRepository = new MemoryAttempts();
    const progressRepository = new MemoryProgress();
    const reviewRepository = new MemoryReviews();
    const run = PracticeRun.create({ id: "transaction", userId: actor.userId, mode: "FOCUSED", scope: { level: "B1", taxonomyNodeId: "topic", taxonomyPath: [], descendantIds: ["topic"], requestedCount: 5 }, activityIds: ["activity-1"], currentIndex: 0, status: "in_progress", datasetVersion: "v1", dailySessionId: null, createdAt: clock.nowIso() });
    await runRepository.save(run);
    const { events, dispatcher } = collectEvents();
    const catalog = { getActivityById: async () => activity("activity-1"), listActivities: async () => [], countActivitiesByNode: async () => 1, countActivitiesByNodes: async () => 1 };
    const result = await submitAttemptTransaction(identity, uow, attemptRepository, runRepository, catalog, progressRepository, reviewRepository, taxonomy, ids, clock, dispatcher, "1.0.0", { runId: run.id, activityId: "activity-1", idempotencyKey: "transaction-key", response: { kind: "boolean", value: false } });
    expect(result.attempt.isCorrect).toBe(false);
    expect(result.reviewUpdated).toBe(true);
    expect(progressRepository.activityValues.get(`${actor.userId}:activity-1`)?.attemptsCount).toBe(1);
    expect(events.map((event) => event.eventName)).toContain("ActivityFailed");
    const duplicate = await submitAttemptTransaction(identity, uow, attemptRepository, runRepository, catalog, progressRepository, reviewRepository, taxonomy, ids, clock, dispatcher, "1.0.0", { runId: run.id, activityId: "activity-1", idempotencyKey: "transaction-key", response: { kind: "boolean", value: false } });
    expect(duplicate.attempt.id).toBe(result.attempt.id);
    expect(events).toHaveLength(1);
  });
});
