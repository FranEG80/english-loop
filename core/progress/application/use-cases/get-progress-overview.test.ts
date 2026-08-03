import { describe, expect, it } from "vitest";
import { actor, clock, identity, MemoryProgress } from "@/test/support/core-fakes";
import { getProgressOverview } from "./get-progress-overview";

describe("getProgressOverview", () => {
  it("uses the actor levels and reports repository progress", async () => {
    const progress = new MemoryProgress();
    await progress.upsertActivityProgress({ userId: actor.userId, activityId: "a1", attemptsCount: 2, correctCount: 1, lastResult: false, lastAttemptAt: clock.nowIso() });
    const reviews = { findByUserIdAndActivity: async () => null, findDueByUserId: async () => [], findUpcomingByUserId: async () => [], save: async () => undefined };
    const result = await getProgressOverview(identity, progress, reviews, clock.nowIso());
    expect(result.activeLevels).toEqual(actor.activeLevels);
    expect(result.accuracyRate).toBe(0.5);
    expect(result.totalActivitiesCompleted).toBe(1);
    expect(result.weeklyActivity).toEqual([]);
  });
});
