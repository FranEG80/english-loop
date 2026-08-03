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
});
