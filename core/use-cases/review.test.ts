import { describe, expect, it } from "vitest";
import type { ActivityQuestionDto, ReviewQueueDto, TaxonomyNodeDto } from "@/core/models";
import type { LearningContentPort, ProgressPort } from "@/core/ports";
import { getReviewHub } from "./review";

describe("getReviewHub", () => {
  it("indexes available due and upcoming activities and omits missing ones", async () => {
    const activity: ActivityQuestionDto = { id: "a1", level: "B1", taxonomyNodeId: "topic", type: "true_false", skillFocus: "true_false", presentation: "true_false", instructions: "Decide.", statement: "True" };
    const queue: ReviewQueueDto = { dueItems: [{ id: "r1", activityId: "a1", taxonomyNodeId: "topic", level: "B1", failedAt: "old", dueAt: "now", attemptsCount: 1 }], upcomingItems: [{ id: "r2", activityId: "missing", taxonomyNodeId: "topic", level: "B1", failedAt: "old", dueAt: "later", attemptsCount: 1 }] };
    const tree: TaxonomyNodeDto[] = [];
    const progress: ProgressPort = { getOverview: async () => { throw new Error("unused"); }, getReviewQueue: async () => queue, getTaxonomyProgress: async () => ({ taxonomyNodeId: "topic", attemptsCount: 0, correctCount: 0, accuracyRate: 0 }), getActivityHistory: async () => ({ activityId: "a1", attempts: [] }) };
    const content: LearningContentPort = { listLessons: async () => [], getLessonById: async () => null, listActivities: async () => [], getActivityById: async (id) => id === "a1" ? activity : null, getTaxonomyTree: async () => tree };
    const result = await getReviewHub(progress, content);
    expect(result.activitiesById).toEqual({ a1: activity });
    expect(result.queue).toBe(queue);
  });
});
