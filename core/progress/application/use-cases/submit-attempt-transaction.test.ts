import { describe, expect, it } from "vitest";
import { activity, clock, collectEvents, identity, ids, makeDailySession, MemoryAttempts, MemoryProgress, MemoryReviews, MemoryRuns, MemorySessions, actor, taxonomy, uow } from "@/test/support/core-fakes";
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
    await expect(submitAttemptTransaction(identity, uow, attemptRepository, runRepository, catalog, progressRepository, reviewRepository, taxonomy, ids, clock, dispatcher, "1.0.0", { runId: run.id, activityId: "activity-1", idempotencyKey: "transaction-key", response: { kind: "boolean", value: true } })).rejects.toMatchObject({ message: "Idempotency key reused with a different payload" });
  });

  it("rejects missing, foreign, completed, stale and unknown run submissions", async () => {
    const submit = (runRepository: MemoryRuns, input: { runId: string; activityId: string }, activityCatalog = { getActivityById: async () => activity("activity-1") }) => submitAttemptTransaction(
      identity, uow, new MemoryAttempts(), runRepository, {
        ...activityCatalog,
        listActivities: async () => [],
        countActivitiesByNode: async () => 1,
        countActivitiesByNodes: async () => 1,
      }, new MemoryProgress(), new MemoryReviews(), taxonomy, ids, clock, collectEvents().dispatcher, "1.0.0", {
        ...input,
        idempotencyKey: `error-${input.runId}-${input.activityId}`,
        response: { kind: "boolean", value: true },
      },
    );

    await expect(submit(new MemoryRuns(), { runId: "missing", activityId: "activity-1" })).rejects.toMatchObject({ message: "Practice run not found: missing" });
    const foreign = new MemoryRuns();
    await foreign.save(PracticeRun.create({ id: "foreign", userId: "other-user", mode: "FOCUSED", scope: { level: "B1", taxonomyNodeId: "topic", taxonomyPath: [], descendantIds: ["topic"], requestedCount: 1 }, activityIds: ["activity-1"], currentIndex: 0, status: "in_progress", datasetVersion: "v1", dailySessionId: null, createdAt: clock.nowIso() }));
    await expect(submit(foreign, { runId: "foreign", activityId: "activity-1" })).rejects.toMatchObject({ message: "Cannot access another user's practice run" });
    const completed = new MemoryRuns();
    await completed.save(PracticeRun.create({ id: "completed", userId: actor.userId, mode: "FOCUSED", scope: { level: "B1", taxonomyNodeId: "topic", taxonomyPath: [], descendantIds: ["topic"], requestedCount: 1 }, activityIds: ["activity-1"], currentIndex: 1, status: "completed", datasetVersion: "v1", dailySessionId: null, createdAt: clock.nowIso() }));
    await expect(submit(completed, { runId: "completed", activityId: "activity-1" })).rejects.toMatchObject({ message: "Cannot submit an attempt to a completed practice run" });
    const stale = new MemoryRuns();
    await stale.save(PracticeRun.create({ id: "stale", userId: actor.userId, mode: "FOCUSED", scope: { level: "B1", taxonomyNodeId: "topic", taxonomyPath: [], descendantIds: ["topic"], requestedCount: 1 }, activityIds: ["activity-2"], currentIndex: 0, status: "in_progress", datasetVersion: "v1", dailySessionId: null, createdAt: clock.nowIso() }));
    await expect(submit(stale, { runId: "stale", activityId: "activity-1" })).rejects.toMatchObject({ message: "Activity is not the current activity of the practice run" });
    const unknownActivity = new MemoryRuns();
    await unknownActivity.save(PracticeRun.create({ id: "unknown", userId: actor.userId, mode: "FOCUSED", scope: { level: "B1", taxonomyNodeId: "topic", taxonomyPath: [], descendantIds: ["topic"], requestedCount: 1 }, activityIds: ["missing-activity"], currentIndex: 0, status: "in_progress", datasetVersion: "v1", dailySessionId: null, createdAt: clock.nowIso() }));
    await expect(submit(unknownActivity, { runId: "unknown", activityId: "missing-activity" }, { getActivityById: async () => null as never })).rejects.toMatchObject({ message: "Activity not found: missing-activity" });
  });

  it("completes correct runs, protects repetition semantics and completes daily sessions", async () => {
    const correctRun = new MemoryRuns();
    const run = PracticeRun.create({ id: "correct", userId: actor.userId, mode: "FOCUSED", scope: { level: "B1", taxonomyNodeId: "topic", taxonomyPath: [], descendantIds: ["topic"], requestedCount: 1 }, activityIds: ["activity-1"], currentIndex: 0, status: "in_progress", datasetVersion: "v1", dailySessionId: null, createdAt: clock.nowIso() });
    await correctRun.save(run);
    const result = await submitAttemptTransaction(identity, uow, new MemoryAttempts(), correctRun, { getActivityById: async () => activity("activity-1"), listActivities: async () => [], countActivitiesByNode: async () => 1, countActivitiesByNodes: async () => 1 }, new MemoryProgress(), new MemoryReviews(), taxonomy, ids, clock, collectEvents().dispatcher, "1.0.0", { runId: "correct", activityId: "activity-1", idempotencyKey: "correct-key", response: { kind: "boolean", value: true } });
    expect(result).toMatchObject({ runCompleted: true, reviewUpdated: false, attempt: { isCorrect: true } });

    const repetitionRuns = new MemoryRuns();
    const repetition = PracticeRun.create({ id: "repetition", userId: actor.userId, mode: "FOCUSED", scope: { level: "B1", taxonomyNodeId: "topic", taxonomyPath: [], descendantIds: ["topic"], requestedCount: 1 }, activityIds: ["activity-1"], currentIndex: 0, status: "in_progress", datasetVersion: "v1", dailySessionId: null, createdAt: clock.nowIso() });
    await repetitionRuns.save(repetition);
    const repetitionAttempts = new MemoryAttempts();
    const deps = { getActivityById: async () => activity("activity-1"), listActivities: async () => [], countActivitiesByNode: async () => 1, countActivitiesByNodes: async () => 1 };
    await submitAttemptTransaction(identity, uow, repetitionAttempts, repetitionRuns, deps, new MemoryProgress(), new MemoryReviews(), taxonomy, ids, clock, collectEvents().dispatcher, "1.0.0", { runId: "repetition", activityId: "activity-1", idempotencyKey: "first-failure", response: { kind: "boolean", value: false } });
    const repeatedResult = await submitAttemptTransaction(identity, uow, repetitionAttempts, repetitionRuns, deps, new MemoryProgress(), new MemoryReviews(), taxonomy, ids, clock, collectEvents().dispatcher, "1.0.0", { runId: "repetition", activityId: "activity-1", idempotencyKey: "repetition-failure", response: { kind: "boolean", value: false } });
    expect(repeatedResult.runCompleted).toBe(true);

    const sessionRepository = new MemorySessions();
    const session = makeDailySession("daily-session", "practice");
    await sessionRepository.save(session);
    const dailyRuns = new MemoryRuns();
    await dailyRuns.save(PracticeRun.create({ id: "daily", userId: actor.userId, mode: "DAILY", scope: { level: "B1", taxonomyNodeId: "daily", taxonomyPath: [], descendantIds: ["daily"], requestedCount: 1 }, activityIds: ["activity-1"], currentIndex: 0, status: "in_progress", datasetVersion: "v1", dailySessionId: session.id, createdAt: clock.nowIso() }));
    const dailyResult = await submitAttemptTransaction(identity, uow, new MemoryAttempts(), dailyRuns, deps, new MemoryProgress(), new MemoryReviews(), taxonomy, ids, clock, collectEvents().dispatcher, "1.0.0", { runId: "daily", activityId: "activity-1", idempotencyKey: "daily-key", response: { kind: "boolean", value: true } }, { dailySessionRepository: sessionRepository });
    expect(dailyResult.runCompleted).toBe(true);
    expect(sessionRepository.values.get(session.id)?.status).toBe("completed");
  });

  it("fails safely when a completed daily run has no matching session", async () => {
    const runRepository = new MemoryRuns();
    await runRepository.save(PracticeRun.create({ id: "daily-missing", userId: actor.userId, mode: "DAILY", scope: { level: "B1", taxonomyNodeId: "daily", taxonomyPath: [], descendantIds: ["daily"], requestedCount: 1 }, activityIds: ["activity-1"], currentIndex: 0, status: "in_progress", datasetVersion: "v1", dailySessionId: "missing-session", createdAt: clock.nowIso() }));
    const deps = { getActivityById: async () => activity("activity-1"), listActivities: async () => [], countActivitiesByNode: async () => 1, countActivitiesByNodes: async () => 1 };
    await expect(submitAttemptTransaction(identity, uow, new MemoryAttempts(), runRepository, deps, new MemoryProgress(), new MemoryReviews(), taxonomy, ids, clock, collectEvents().dispatcher, "1.0.0", { runId: "daily-missing", activityId: "activity-1", idempotencyKey: "daily-missing-key", response: { kind: "boolean", value: true } }, { dailySessionRepository: new MemorySessions() })).rejects.toMatchObject({ message: "Daily session not found for run: daily-missing" });
  });
});
