import { describe, expect, it } from "vitest";
import type { Activity } from "@/core/content/domain/types/activity";
import type { ActivityCatalogPort } from "@/core/content/ports/catalog-ports";
import { InsufficientActivitiesForScopeException } from "@/core/shared/exceptions";
import { DailyPracticePlanner } from "./daily-practice-planner";

const makeActivity = (id: string, versionId?: string): Activity => ({
  id,
  versionId,
  level: "B1",
  type: "true_false",
  category: "grammar",
  topic: "topic",
  subtopic: "subtopic",
  taxonomyNodeIds: ["topic"],
  difficulty: 1,
  instructions: "Choose",
  prompt: id,
  lessonIds: ["lesson-1"],
  tags: [],
  estimatedSeconds: 10,
  evaluator: { strategy: "boolean", correct: true },
  explanation: "Because",
  status: "published",
});

describe("DailyPracticePlanner", () => {
  it("returns the selected activity versions for the daily snapshot", async () => {
    const activities = [makeActivity("a1", "a1-v1"), makeActivity("a2")];
    const catalog: ActivityCatalogPort = {
      listActivities: async () => activities,
      getActivityById: async (id) => activities.find((activity) => activity.id === id) ?? null,
      countActivitiesByNode: async () => activities.length,
      countActivitiesByNodes: async () => activities.length,
    };
    const planner = new DailyPracticePlanner({ int: () => 0, float: () => 0, shuffle: <T>(items: readonly T[]) => [...items] });

    await expect(planner.plan(catalog, { lessonIds: ["lesson-1"], level: "B1", count: 2 })).resolves.toEqual({
      activityIds: ["a1", "a2"],
      activityVersionIds: ["a1-v1", null],
      activitySnapshots: activities,
    });
  });

  it("rejects a daily goal larger than the selected pool", async () => {
    const catalog: ActivityCatalogPort = {
      listActivities: async () => [makeActivity("a1")],
      getActivityById: async () => null,
      countActivitiesByNode: async () => 1,
      countActivitiesByNodes: async () => 1,
    };
    const planner = new DailyPracticePlanner({ int: () => 0, float: () => 0, shuffle: <T>(items: readonly T[]) => [...items] });

    await expect(planner.plan(catalog, { lessonIds: ["lesson-1"], level: "B1", count: 2 })).rejects.toBeInstanceOf(InsufficientActivitiesForScopeException);
  });
});
