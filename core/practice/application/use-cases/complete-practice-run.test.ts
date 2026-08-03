import { describe, expect, it } from "vitest";
import { actor, clock, identity, MemoryRuns } from "@/test/support/core-fakes";
import { PracticeRun } from "../../domain/practice-run";
import { completePracticeRun } from "./complete-practice-run";

describe("completePracticeRun", () => {
  it("advances an in-progress run to its terminal state and is idempotent", async () => {
    const repository = new MemoryRuns();
    const run = PracticeRun.create({ id: "run", userId: actor.userId, mode: "FOCUSED", scope: { level: "B1", taxonomyNodeId: "topic", taxonomyPath: [], descendantIds: ["topic"], requestedCount: 5 }, activityIds: ["a1", "a2"], currentIndex: 0, status: "in_progress", datasetVersion: "v1", dailySessionId: null, createdAt: clock.nowIso() });
    await repository.save(run);
    expect((await completePracticeRun(identity, repository, run.id)).status).toBe("completed");
    expect((await completePracticeRun(identity, repository, run.id)).status).toBe("completed");
    expect(run.currentIndex).toBe(2);
  });
});
