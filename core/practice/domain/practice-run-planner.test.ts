import { describe, expect, it, vi } from "vitest";
import type { ActivityCatalogPort } from "@/core/content/ports/catalog-ports";
import type { Activity } from "@/core/content/domain/types/activity";
import { InsufficientActivitiesForScopeException } from "@/core/shared/exceptions";
import { PracticeRunPlanner } from "./practice-run-planner";

const random = { int: (max: number) => Math.max(0, max - 1), float: () => 0, shuffle: <T>(items: readonly T[]) => [...items] };
const activity = (id: string, subtopic: string, node = "grammar"): Activity => ({
  id,
  level: "B1",
  type: "true_false", skillFocus: "fill_blank",
  category: "grammar",
  topic: "topic",
  subtopic,
  taxonomyNodeIds: [node],
  difficulty: 1,
  instructions: "Decide",
  prompt: id,
  lessonIds: [],
  tags: [],
  estimatedSeconds: 20,
  evaluator: { strategy: "boolean", correct: true },
  explanation: "Because",
  status: "published",
});

const activities = [activity("a1", "tense"), activity("a2", "vocabulary"), activity("a3", "tense"), activity("a4", "vocabulary"), activity("a5", "tense"), activity("a6", "vocabulary")];
const catalog: ActivityCatalogPort = {
  listActivities: async () => activities,
  getActivityById: async (id) => activities.find((item) => item.id === id) ?? null,
  getActivityByVersionId: async (versionId) => activities.find((item) => item.versionId === versionId) ?? null,
  countActivitiesByNode: async () => activities.length,
  countActivitiesByNodes: async () => activities.length,
};

describe("PracticeRunPlanner", () => {
  it("requests activities for the selected level", async () => {
    const listActivities = vi.fn(async () => activities);

    await new PracticeRunPlanner(random).plan(
      { ...catalog, listActivities },
      {
        level: "B1",
        taxonomyNodeId: "grammar",
        descendantIds: ["grammar"],
        requestedCount: 5,
      },
    );

    expect(listActivities).toHaveBeenCalledWith({ level: "B1" });
  });

  it("excludes recent activities when the remaining pool is sufficient and balances subtopics", async () => {
    const result = await new PracticeRunPlanner(random).plan(catalog, {
      level: "B1",
      taxonomyNodeId: "grammar",
      descendantIds: ["grammar"],
      requestedCount: 5,
      excludeActivityIds: ["a1"],
    });
    expect(result.activityIds).toHaveLength(5);
    expect(result.activityIds).not.toContain("a1");
    expect(result.coveredSubtopicIds).toEqual(["vocabulary", "tense"]);
  });

  it("falls back to the full in-scope pool when exclusions leave too few activities", async () => {
    const result = await new PracticeRunPlanner(random).plan(catalog, {
      level: "B1",
      taxonomyNodeId: "grammar",
      descendantIds: ["grammar"],
      requestedCount: 5,
      excludeActivityIds: ["a1", "a2", "a3"],
    });
    expect(result.activityIds).toHaveLength(5);
  });

  it("rejects a scope that cannot satisfy the requested size", async () => {
    await expect(new PracticeRunPlanner(random).plan(catalog, {
      level: "B1",
      taxonomyNodeId: "writing",
      descendantIds: ["writing"],
      requestedCount: 5,
    })).rejects.toBeInstanceOf(InsufficientActivitiesForScopeException);
  });
});
