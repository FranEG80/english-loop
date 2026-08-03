import { describe, expect, it } from "vitest";
import { ReviewItem } from "./review-item";

describe("ReviewItem", () => {
  it("exposes an immutable snapshot and normalizes optional relationships", () => {
    const item = ReviewItem.create({
      id: "review-1",
      userId: "user-1",
      activityId: "activity-1",
      activityVersionId: "version-1",
      lessonId: "lesson-1",
      taxonomyNodeId: "grammar",
      level: "B1",
      stage: 2,
      consecutiveCorrect: 2,
      dueAt: "2026-08-05T00:00:00.000Z",
      failedAt: "2026-08-01T00:00:00.000Z",
      resolvedAt: null,
      attemptsCount: 3,
    });

    expect(item.id).toBe("review-1");
    expect(item.userId).toBe("user-1");
    expect(item.activityId).toBe("activity-1");
    expect(item.activityVersionId).toBe("version-1");
    expect(item.lessonId).toBe("lesson-1");
    expect(item.taxonomyNodeId).toBe("grammar");
    expect(item.level).toBe("B1");
    expect(item.stage).toBe(2);
    expect(item.consecutiveCorrect).toBe(2);
    expect(item.dueAt).toBe("2026-08-05T00:00:00.000Z");
    expect(item.failedAt).toBe("2026-08-01T00:00:00.000Z");
    expect(item.resolvedAt).toBeNull();
    expect(item.attemptsCount).toBe(3);
    expect(item.isResolved).toBe(false);
    expect(item.toSnapshot()).toMatchObject({ activityVersionId: "version-1", lessonId: "lesson-1" });

    const unresolved = ReviewItem.create({
      ...item.toSnapshot(),
      id: "review-2",
      activityVersionId: undefined,
      lessonId: undefined,
      stage: 3,
      resolvedAt: "2026-08-06T00:00:00.000Z",
    });
    expect(unresolved.activityVersionId).toBeNull();
    expect(unresolved.lessonId).toBeNull();
    expect(unresolved.isResolved).toBe(true);
  });
});
