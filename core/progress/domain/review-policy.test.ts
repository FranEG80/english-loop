import { describe, expect, it } from "vitest";
import { ReviewPolicy } from "@/core/progress/domain/review-policy";
import { ReviewItem } from "@/core/progress/domain/review-item";

function makeItem(overrides: Partial<Parameters<typeof ReviewItem.create>[0]> = {}) {
  return ReviewItem.create({
    id: "review-1",
    userId: "u1",
    activityId: "a1",
    taxonomyNodeId: "grammar",
    level: "B1",
    stage: 0,
    consecutiveCorrect: 0,
    dueAt: "2026-08-04T00:00:00.000Z",
    failedAt: "2026-08-03T00:00:00.000Z",
    resolvedAt: null,
    attemptsCount: 1,
    ...overrides,
  });
}

describe("ReviewPolicy", () => {
  const now = new Date("2026-08-03T12:00:00.000Z");

  it("schedules first review for the next day after a failure", () => {
    const policy = new ReviewPolicy(now);
    const result = policy.apply(makeItem(), false);
    expect(result.stage).toBe(0);
    expect(result.consecutiveCorrect).toBe(0);
    expect(result.resolved).toBe(false);
    expect(result.dueAt).toBe("2026-08-04T12:00:00.000Z");
  });

  it("schedules to 3 days after first correct", () => {
    const policy = new ReviewPolicy(now);
    const result = policy.apply(makeItem(), true);
    expect(result.stage).toBe(1);
    expect(result.consecutiveCorrect).toBe(1);
    expect(result.dueAt).toBe("2026-08-06T12:00:00.000Z");
  });

  it("schedules to 7 days after second consecutive correct", () => {
    const policy = new ReviewPolicy(now);
    const item = makeItem({ stage: 1, consecutiveCorrect: 1 });
    const result = policy.apply(item, true);
    expect(result.stage).toBe(2);
    expect(result.consecutiveCorrect).toBe(2);
    expect(result.dueAt).toBe("2026-08-10T12:00:00.000Z");
  });

  it("resolves after third consecutive correct", () => {
    const policy = new ReviewPolicy(now);
    const item = makeItem({ stage: 2, consecutiveCorrect: 2 });
    const result = policy.apply(item, true);
    expect(result.stage).toBe(3);
    expect(result.resolved).toBe(true);
  });

  it("resets stage after a new failure", () => {
    const policy = new ReviewPolicy(now);
    const item = makeItem({ stage: 2, consecutiveCorrect: 2 });
    const result = policy.apply(item, false);
    expect(result.stage).toBe(0);
    expect(result.consecutiveCorrect).toBe(0);
    expect(result.resolved).toBe(false);
  });
});
