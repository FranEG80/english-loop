import { describe, expect, it } from "vitest";
import { actor, activity, clock, identity, MemoryAttempts, MemoryRuns } from "@/test/support/core-fakes";
import { ActivityAttempt } from "../../domain/activity-attempt";
import { PracticeRun } from "../../domain/practice-run";
import { getPracticeRunSummary } from "./get-practice-run-summary";

describe("getPracticeRunSummary", () => {
  it("counts attempts and returns sorted covered taxonomy ids", async () => {
    const runs = new MemoryRuns();
    const attempts = new MemoryAttempts();
    const run = PracticeRun.create({ id: "summary", userId: actor.userId, mode: "FOCUSED", scope: { level: "B1", taxonomyNodeId: "topic", taxonomyPath: [], descendantIds: ["topic"], requestedCount: 5 }, activityIds: ["activity-1", "activity-2"], currentIndex: 0, status: "in_progress", datasetVersion: "v1", dailySessionId: null, createdAt: clock.nowIso() });
    await runs.save(run);
    for (const [id, activityId, isCorrect] of [["a1", "activity-1", true], ["a2", "activity-2", false]] as const) await attempts.save(ActivityAttempt.create({ id, userId: actor.userId, practiceRunId: run.id, activityId, origin: "FOCUSED", idempotencyKey: id, response: { kind: "boolean", value: isCorrect }, isCorrect, evaluatorVersion: "1", submittedAt: clock.nowIso() }));
    const catalog = { getActivityById: async (id: string) => activity(id, ["root", id === "activity-1" ? "topic" : "subtopic"]), listActivities: async () => [], countActivitiesByNode: async () => 1, countActivitiesByNodes: async () => 1 };
    const result = await getPracticeRunSummary(identity, runs, attempts, catalog, run.id);
    expect(result).toMatchObject({ runId: run.id, correctCount: 1, incorrectCount: 1 });
    expect(result.coveredSubtopicIds).toEqual(["root", "subtopic", "topic"]);
  });

  it("falls back to the activity id when an attempt version is unavailable", async () => {
    const runs = new MemoryRuns();
    const attempts = new MemoryAttempts();
    const run = PracticeRun.create({ id: "legacy-summary", userId: actor.userId, mode: "FOCUSED", scope: { level: "B1", taxonomyNodeId: "topic", taxonomyPath: [], descendantIds: ["topic"], requestedCount: 1 }, activityIds: ["activity-1"], currentIndex: 0, status: "in_progress", datasetVersion: "v1", dailySessionId: null, createdAt: clock.nowIso() });
    await runs.save(run);
    await attempts.save(ActivityAttempt.create({ id: "legacy-attempt", userId: actor.userId, practiceRunId: run.id, activityId: "activity-1", activityVersionId: "database-version", origin: "FOCUSED", idempotencyKey: "legacy-attempt", response: { kind: "boolean", value: true }, isCorrect: true, evaluatorVersion: "1", submittedAt: clock.nowIso() }));
    const catalog = { getActivityById: async () => activity("activity-1", ["root", "legacy-topic"]), getActivityByVersionId: async () => null, listActivities: async () => [], countActivitiesByNode: async () => 1, countActivitiesByNodes: async () => 1 };

    const result = await getPracticeRunSummary(identity, runs, attempts, catalog, run.id);

    expect(result.coveredSubtopicIds).toEqual(["legacy-topic", "root"]);
  });

  // El resumen solo daba dos contadores: no se podía saber en qué te habías
  // equivocado ni por qué.
  it("lista todos los fallos con su desglose y su explicación", async () => {
    const runs = new MemoryRuns();
    const attempts = new MemoryAttempts();
    const run = PracticeRun.create({ id: "errors", userId: actor.userId, mode: "FOCUSED", scope: { level: "B1", taxonomyNodeId: "topic", taxonomyPath: [], descendantIds: ["topic"], requestedCount: 2 }, activityIds: ["activity-1", "activity-2"], originalActivityCount: 2, currentIndex: 2, status: "in_progress", datasetVersion: "v1", dailySessionId: null, createdAt: clock.nowIso() });
    await runs.save(run);
    await attempts.save(ActivityAttempt.create({ id: "wrong", userId: actor.userId, practiceRunId: run.id, activityId: "activity-1", origin: "FOCUSED", idempotencyKey: "wrong", response: { kind: "single", value: "b" }, isCorrect: false, evaluatorVersion: "1", submittedAt: clock.nowIso() }));
    await attempts.save(ActivityAttempt.create({ id: "right", userId: actor.userId, practiceRunId: run.id, activityId: "activity-2", origin: "FOCUSED", idempotencyKey: "right", response: { kind: "single", value: "a" }, isCorrect: true, evaluatorVersion: "1", submittedAt: clock.nowIso() }));

    const catalog = {
      getActivityById: async (id: string) => ({
        ...activity(id, ["root", "topic"]),
        prompt: `Enunciado de ${id}`,
        explanation: `Explicación de ${id}`,
        options: [
          { id: "a", text: "make a decision" },
          { id: "b", text: "do housework" },
        ],
        evaluator: { strategy: "single_option" as const, correctOptionId: "a" },
      }),
      listActivities: async () => [],
      countActivitiesByNode: async () => 1,
      countActivitiesByNodes: async () => 1,
    };

    const result = await getPracticeRunSummary(identity, runs, attempts, catalog, run.id);

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatchObject({
      activityId: "activity-1",
      prompt: "Enunciado de activity-1",
      explanation: "Explicación de activity-1",
    });
    expect(result.errors[0]!.items[0]).toMatchObject({
      given: "do housework",
      expected: ["make a decision"],
      isCorrect: false,
    });
  });

  it("deja fuera del listado las repeticiones y los aciertos", async () => {
    const runs = new MemoryRuns();
    const attempts = new MemoryAttempts();
    const run = PracticeRun.create({ id: "errors-repeat", userId: actor.userId, mode: "FOCUSED", scope: { level: "B1", taxonomyNodeId: "topic", taxonomyPath: [], descendantIds: ["topic"], requestedCount: 1 }, activityIds: ["activity-1", "activity-1"], originalActivityCount: 1, repetitionActivityIds: ["activity-1"], currentIndex: 2, status: "in_progress", datasetVersion: "v1", dailySessionId: null, createdAt: clock.nowIso() });
    await runs.save(run);
    await attempts.save(ActivityAttempt.create({ id: "repeat-fail", userId: actor.userId, practiceRunId: run.id, activityId: "activity-1", origin: "FOCUSED", idempotencyKey: "repeat-fail", response: { kind: "boolean", value: false }, isCorrect: false, isRepetition: true, evaluatorVersion: "1", submittedAt: clock.nowIso() }));
    const catalog = { getActivityById: async (id: string) => activity(id, ["root", "topic"]), listActivities: async () => [], countActivitiesByNode: async () => 1, countActivitiesByNodes: async () => 1 };

    const result = await getPracticeRunSummary(identity, runs, attempts, catalog, run.id);

    expect(result.errors).toEqual([]);
  });

  it("does not inflate the original score with a recovered repetition", async () => {
    const runs = new MemoryRuns();
    const attempts = new MemoryAttempts();
    const run = PracticeRun.create({ id: "score", userId: actor.userId, mode: "FOCUSED", scope: { level: "B1", taxonomyNodeId: "topic", taxonomyPath: [], descendantIds: ["topic"], requestedCount: 2 }, activityIds: ["activity-1", "activity-2", "activity-1"], originalActivityCount: 2, repetitionActivityIds: ["activity-1"], currentIndex: 2, status: "in_progress", datasetVersion: "v1", dailySessionId: null, createdAt: clock.nowIso() });
    await runs.save(run);
    await attempts.save(ActivityAttempt.create({ id: "original-fail", userId: actor.userId, practiceRunId: run.id, activityId: "activity-1", origin: "FOCUSED", idempotencyKey: "original-fail", response: { kind: "boolean", value: false }, isCorrect: false, evaluatorVersion: "1", submittedAt: clock.nowIso() }));
    await attempts.save(ActivityAttempt.create({ id: "original-ok", userId: actor.userId, practiceRunId: run.id, activityId: "activity-2", origin: "FOCUSED", idempotencyKey: "original-ok", response: { kind: "boolean", value: true }, isCorrect: true, evaluatorVersion: "1", submittedAt: clock.nowIso() }));
    await attempts.save(ActivityAttempt.create({ id: "recovery", userId: actor.userId, practiceRunId: run.id, activityId: "activity-1", origin: "FOCUSED", idempotencyKey: "recovery", response: { kind: "boolean", value: true }, isCorrect: true, isRepetition: true, submittedAt: clock.nowIso(), evaluatorVersion: "1" }));
    const catalog = { getActivityById: async (id: string) => activity(id, ["root", "topic"]), listActivities: async () => [], countActivitiesByNode: async () => 1, countActivitiesByNodes: async () => 1 };

    const result = await getPracticeRunSummary(identity, runs, attempts, catalog, run.id);

    expect(result.correctCount).toBe(1);
    expect(result.incorrectCount).toBe(1);
    expect(result.recoveredCount).toBe(1);
    expect(result.scorePercent).toBe(50);
  });
});
