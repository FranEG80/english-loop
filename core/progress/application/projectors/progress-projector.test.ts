import { describe, expect, it, vi } from "vitest";
import type { Activity } from "@/core/content/domain/types/activity";
import type { TaxonomyCatalogPort } from "@/core/content/ports/catalog-ports";
import type { TaxonomyNode } from "@/core/content/domain/types/taxonomy";
import type { ProgressRepository } from "@/core/progress/ports/progress-repository";
import type { ReviewRepository } from "@/core/progress/ports/review-repository";
import { ReviewItem } from "@/core/progress/domain/review-item";
import { ProgressProjector } from "./progress-projector";

const activity: Activity = {
  id: "activity-1", level: "B1", type: "true_false", skillFocus: "fill_blank", category: "grammar", topic: "t", subtopic: "s",
  taxonomyNodeIds: ["child", "root"], difficulty: 1, instructions: "", prompt: "", lessonIds: [], tags: [], estimatedSeconds: 10,
  evaluator: { strategy: "boolean", correct: true }, explanation: "", status: "published",
};

function harness(existingActivity = null as Awaited<ReturnType<ReviewRepository["findByUserIdAndActivity"]>>, paths = new Map<string, Array<{ id: string }>>([ ["child", [{ id: "root" }, { id: "child" }]], ["root", [{ id: "root" }]] ])) {
  const progress: ProgressRepository = {
    getActivityProgress: vi.fn(async () => null),
    upsertActivityProgress: vi.fn(async () => undefined),
    getTaxonomyProgress: vi.fn(async () => null),
    upsertTaxonomyProgress: vi.fn(async () => undefined),
    getOverview: vi.fn(async () => ({ totalActivitiesCompleted: 0, totalCorrect: 0, totalAttempts: 0, strongTopicIds: [], weakTopicIds: [] })),
  };
  const review: ReviewRepository = {
    findByUserIdAndActivity: vi.fn(async () => existingActivity),
    findDueByUserId: vi.fn(async () => []), findUpcomingByUserId: vi.fn(async () => []), save: vi.fn(async () => undefined),
  };
  const taxonomy: TaxonomyCatalogPort = {
    getNodePath: vi.fn(async (id) => (paths.get(id) ?? []) as TaxonomyNode[]),
    getTaxonomyTree: vi.fn(async () => []), resolveNodeWithDescendants: vi.fn(async () => []),
    getContentVersion: vi.fn(async () => ({ datasetVersion: "v1", schemaVersion: "1" })),
  };
  const projector = new ProgressProjector(progress, review, taxonomy, { generate: () => "review-1" }, { now: () => new Date("2026-08-03"), nowIso: () => "2026-08-03T00:00:00.000Z" });
  return { progress, review, taxonomy, projector };
}

describe("ProgressProjector", () => {
  it("projects an incorrect attempt into activity, ancestor taxonomy and a new review", async () => {
    const { projector, progress, review } = harness();
    expect(await projector.project({ userId: "u", activity, origin: "DAILY", isCorrect: false, attemptedAt: "2026-08-03T00:00:00.000Z" })).toBe(true);
    expect(progress.upsertActivityProgress).toHaveBeenCalledWith(expect.objectContaining({ attemptsCount: 1, correctCount: 0, lastResult: false }));
    expect(progress.upsertTaxonomyProgress).toHaveBeenCalledTimes(2);
    expect(review.save).toHaveBeenCalledWith(expect.objectContaining({ id: "review-1", attemptsCount: 1 }));
  });

  it("advances an existing review on an incorrect retry", async () => {
    const existing = ReviewItem.create({ id: "review", userId: "u", activityId: activity.id, taxonomyNodeId: "child", level: "B1", stage: 0, consecutiveCorrect: 0, dueAt: "2026-08-02T00:00:00.000Z", failedAt: "2026-08-02T00:00:00.000Z", resolvedAt: null, attemptsCount: 1 });
    const { projector, review } = harness(existing);
    await projector.project({ userId: "u", activity, origin: "DAILY", isCorrect: false, attemptedAt: "2026-08-03T00:00:00.000Z" });
    expect(review.save).toHaveBeenCalledWith(expect.objectContaining({ id: "review", attemptsCount: 2 }));
  });

  it("resolves an active smart-review item after a correct answer", async () => {
    const existing = ReviewItem.create({ id: "review", userId: "u", activityId: activity.id, taxonomyNodeId: "child", level: "B1", stage: 2, consecutiveCorrect: 2, dueAt: "2026-08-02T00:00:00.000Z", failedAt: "2026-08-01T00:00:00.000Z", resolvedAt: null, attemptsCount: 2 });
    const { projector, review } = harness(existing);
    expect(await projector.project({ userId: "u", activity, origin: "SMART_REVIEW", isCorrect: true, attemptedAt: "2026-08-03T00:00:00.000Z" })).toBe(true);
    expect(review.save).toHaveBeenCalledWith(expect.objectContaining({ id: "review", resolvedAt: "2026-08-03T00:00:00.000Z" }));
  });

  it("returns false for a correct non-review attempt and exposes its clock", async () => {
    const { projector } = harness();
    expect(await projector.project({ userId: "u", activity, origin: "DAILY", isCorrect: true, attemptedAt: "2026-08-03T00:00:00.000Z" })).toBe(false);
    expect(projector.nowIso()).toBe("2026-08-03T00:00:00.000Z");
  });

  it("falls back to the activity taxonomy id when its path is empty", async () => {
    const orphan = { ...activity, id: "orphan", taxonomyNodeIds: ["unknown"], lessonIds: [] };
    const { projector, progress, review } = harness(null, new Map());
    await projector.project({ userId: "u", activity: orphan, origin: "DAILY", isCorrect: false, attemptedAt: "2026-08-03T00:00:00.000Z" });
    expect(progress.upsertTaxonomyProgress).toHaveBeenCalledWith(expect.objectContaining({ taxonomyNodeId: "unknown" }));
    expect(review.save).toHaveBeenCalledWith(expect.objectContaining({ taxonomyNodeId: "unknown", lessonId: null }));
  });

  it("does not update resolved reviews and keeps an active review pending after an early success", async () => {
    const resolved = ReviewItem.create({ id: "resolved", userId: "u", activityId: activity.id, taxonomyNodeId: "child", level: "B1", stage: 3, consecutiveCorrect: 3, dueAt: "2026-08-02T00:00:00.000Z", failedAt: "2026-08-01T00:00:00.000Z", resolvedAt: "2026-08-02T00:00:00.000Z", attemptsCount: 3 });
    const resolvedHarness = harness(resolved);
    expect(await resolvedHarness.projector.project({ userId: "u", activity, origin: "SMART_REVIEW", isCorrect: true, attemptedAt: "2026-08-03T00:00:00.000Z" })).toBe(false);
    expect(resolvedHarness.review.save).not.toHaveBeenCalled();

    const active = ReviewItem.create({ id: "active", userId: "u", activityId: activity.id, taxonomyNodeId: "child", level: "B1", stage: 0, consecutiveCorrect: 0, dueAt: "2026-08-02T00:00:00.000Z", failedAt: "2026-08-01T00:00:00.000Z", resolvedAt: null, attemptsCount: 1 });
    const activeHarness = harness(active);
    expect(await activeHarness.projector.project({ userId: "u", activity, origin: "SMART_REVIEW", isCorrect: true, attemptedAt: "2026-08-03T00:00:00.000Z" })).toBe(true);
    expect(activeHarness.review.save).toHaveBeenCalledWith(expect.objectContaining({ resolvedAt: null }));
  });

  it("increments and later resolves lesson pending errors after the third smart-review success", async () => {
    const lessonProgress = new Map<string, { userId: string; lessonId: string; viewed: boolean; viewedAt: string | null; errorsPending: number }>();
    const repository = {
      findByUserId: async () => [...lessonProgress.values()],
      upsert: async (record: { userId: string; lessonId: string; viewed: boolean; viewedAt: string | null; errorsPending: number }) => {
        lessonProgress.set(record.lessonId, record);
      },
    };
    const failing = { ...activity, lessonIds: ["lesson-1"] };
    const first = harness();
    const withProgress = new ProgressProjector(first.progress, first.review, first.taxonomy, { generate: () => "review-progress" }, { now: () => new Date("2026-08-03"), nowIso: () => "2026-08-03T00:00:00.000Z" }, repository);

    await withProgress.project({ userId: "u", activity: failing, origin: "DAILY", isCorrect: false, attemptedAt: "2026-08-03T00:00:00.000Z" });
    expect(lessonProgress.get("lesson-1")?.errorsPending).toBe(1);

    const existing = ReviewItem.create({ id: "review-progress", userId: "u", activityId: failing.id, lessonId: "lesson-1", taxonomyNodeId: "child", level: "B1", stage: 2, consecutiveCorrect: 2, dueAt: "2026-08-02T00:00:00.000Z", failedAt: "2026-08-01T00:00:00.000Z", resolvedAt: null, attemptsCount: 2 });
    const resolvedHarness = harness(existing);
    const resolving = new ProgressProjector(resolvedHarness.progress, resolvedHarness.review, resolvedHarness.taxonomy, { generate: () => "review-progress" }, { now: () => new Date("2026-08-03"), nowIso: () => "2026-08-03T00:00:00.000Z" }, repository);
    await resolving.project({ userId: "u", activity: failing, origin: "SMART_REVIEW", isCorrect: true, attemptedAt: "2026-08-03T00:00:00.000Z" });
    expect(lessonProgress.get("lesson-1")?.errorsPending).toBe(0);
  });
});
