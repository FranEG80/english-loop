import { describe, expect, it } from "vitest";
import type { ProgressOverviewDto, TaxonomyNodeDto } from "@/core/models";
import type { LearningContentPort, ProgressPort } from "@/core/ports";
import { getProgressSnapshot } from "./progress";

describe("getProgressSnapshot", () => {
  it("combines the three independent read models", async () => {
    const overview: ProgressOverviewDto = { activeLevels: ["B1"], streakDays: 1, accuracyRate: 1, totalLessonsViewed: 1, totalActivitiesCompleted: 1, strongTopicIds: [], weakTopicIds: [], pendingReviewCount: 0, weeklyActivity: [] };
    const queue = { dueItems: [], upcomingItems: [] };
    const taxonomy: TaxonomyNodeDto[] = [{ id: "grammar", type: "category", label: { en: "Grammar", es: "Gramática" }, levels: ["B1"], children: [] }];
    const progress: ProgressPort = { getOverview: async () => overview, getReviewQueue: async () => queue, getTaxonomyProgress: async (taxonomyNodeId) => ({ taxonomyNodeId, attemptsCount: 0, correctCount: 0, accuracyRate: 0 }), getActivityHistory: async (activityId) => ({ activityId, attempts: [] }) };
    const content: LearningContentPort = { listLessons: async () => [], getLessonById: async () => null, listActivities: async () => [], getActivityById: async () => null, getTaxonomyTree: async () => taxonomy };
    await expect(getProgressSnapshot(progress, content)).resolves.toEqual({ overview, reviewQueue: queue, taxonomy });
  });
});
