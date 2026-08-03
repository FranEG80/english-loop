import { describe, expect, it } from "vitest";
import { actor, clock, identity } from "@/test/support/core-fakes";
import { ReviewItem } from "@/core/progress/domain/review-item";
import { getReviewQueue } from "./get-review-queue";

describe("getReviewQueue", () => {
  it("maps due and upcoming domain records to public DTOs", async () => {
    const item = ReviewItem.create({ id: "review", userId: actor.userId, activityId: "a1", taxonomyNodeId: "topic", level: "B1", stage: 0, consecutiveCorrect: 0, dueAt: clock.nowIso(), failedAt: clock.nowIso(), resolvedAt: null, attemptsCount: 2 });
    const repository = { findByUserIdAndActivity: async () => item, findDueByUserId: async () => [item], findUpcomingByUserId: async () => [item], save: async () => undefined };
    const result = await getReviewQueue(identity, repository, clock.nowIso());
    expect(result.dueItems[0]).toMatchObject({ id: "review", activityId: "a1", attemptsCount: 2 });
    expect(result.upcomingItems).toHaveLength(1);
  });
});
