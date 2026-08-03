import { describe, expect, it } from "vitest";
import { actor, identity, MemoryProgress } from "@/test/support/core-fakes";
import { getTaxonomyProgress } from "./get-taxonomy-progress";

describe("getTaxonomyProgress", () => {
  it("calculates accuracy and defaults an unknown node to zero", async () => {
    const repository = new MemoryProgress();
    await repository.upsertTaxonomyProgress({ userId: actor.userId, taxonomyNodeId: "topic", attemptsCount: 2, correctCount: 1 });
    expect((await getTaxonomyProgress(identity, repository, "topic")).accuracyRate).toBe(0.5);
    expect(await getTaxonomyProgress(identity, repository, "missing")).toEqual({ taxonomyNodeId: "missing", attemptsCount: 0, correctCount: 0, accuracyRate: 0 });
  });
});
