import { describe, expect, it } from "vitest";
import { actor, clock, identity, MemoryProgress } from "@/test/support/core-fakes";
import { ReviewItem } from "@/core/progress/domain/review-item";
import { getDashboardSummary } from "./get-dashboard-summary";

describe("getDashboardSummary", () => {
  it("calculates accuracy, completed activities and pending reviews", async () => {
    const progress = new MemoryProgress();
    await progress.upsertActivityProgress({ userId: actor.userId, activityId: "a1", attemptsCount: 4, correctCount: 3, lastResult: true, lastAttemptAt: clock.nowIso() });
    const review = ReviewItem.create({ id: "review", userId: actor.userId, activityId: "a1", taxonomyNodeId: "topic", level: "B1", stage: 0, consecutiveCorrect: 0, dueAt: clock.nowIso(), failedAt: clock.nowIso(), resolvedAt: null, attemptsCount: 1 });
    const reviews = { findByUserIdAndActivity: async () => review, findDueByUserId: async () => [review], findUpcomingByUserId: async () => [], save: async () => undefined };
    await expect(getDashboardSummary(identity, progress, reviews, clock.nowIso())).resolves.toMatchObject({ accuracyRate: 0.75, totalActivitiesCompleted: 1, pendingReviewCount: 1 });
  });
});
