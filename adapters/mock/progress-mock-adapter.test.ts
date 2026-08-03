import { describe, expect, it } from "vitest";
import { progressMockAdapter } from "./progress-mock-adapter";

describe("progressMockAdapter", () => {
  it("returns the mock overview, queue and empty per-item defaults", async () => {
    expect((await progressMockAdapter.getOverview()).totalActivitiesCompleted).toBeGreaterThan(0);
    expect((await progressMockAdapter.getReviewQueue()).dueItems.length).toBeGreaterThan(0);
    expect(await progressMockAdapter.getTaxonomyProgress("topic")).toEqual({ taxonomyNodeId: "topic", attemptsCount: 0, correctCount: 0, accuracyRate: 0 });
    expect(await progressMockAdapter.getActivityHistory("activity")).toEqual({ activityId: "activity", attempts: [] });
  });
});
