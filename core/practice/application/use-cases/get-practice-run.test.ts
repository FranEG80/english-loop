import { describe, expect, it } from "vitest";
import { actor, clock, identity, MemoryRuns } from "@/test/support/core-fakes";
import { PracticeRun } from "../../domain/practice-run";
import { getPracticeRun } from "./get-practice-run";
import { ForbiddenException, ResourceNotFoundException } from "@/core/shared/exceptions";

function makeRun(id: string, userId = actor.userId) {
  return PracticeRun.create({ id, userId, mode: "FOCUSED", scope: { level: "B1", taxonomyNodeId: "topic", taxonomyPath: ["topic"], descendantIds: ["topic"], requestedCount: 5 }, activityIds: ["activity-1"], currentIndex: 0, status: "in_progress", datasetVersion: "v1", dailySessionId: null, createdAt: clock.nowIso() });
}

describe("getPracticeRun", () => {
  it("returns only the actor's run and maps missing/foreign records to errors", async () => {
    const repository = new MemoryRuns();
    await repository.save(makeRun("mine"));
    await repository.save(makeRun("foreign", "other-user"));
    expect((await getPracticeRun(identity, repository, "mine")).id).toBe("mine");
    await expect(getPracticeRun(identity, repository, "missing")).rejects.toBeInstanceOf(ResourceNotFoundException);
    await expect(getPracticeRun(identity, repository, "foreign")).rejects.toBeInstanceOf(ForbiddenException);
  });
});
