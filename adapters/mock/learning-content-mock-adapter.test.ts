import { describe, expect, it } from "vitest";
import { learningContentMockAdapter } from "./learning-content-mock-adapter";

describe("learningContentMockAdapter", () => {
  it("filters by level and taxonomy and returns null for missing data", async () => {
    expect((await learningContentMockAdapter.listLessons({ level: "B2" })).every((lesson) => lesson.level === "B2")).toBe(true);
    const activities = await learningContentMockAdapter.listActivities({ taxonomyNodeId: "grammar.conditionals" });
    expect(activities.every((activity) => activity.taxonomyNodeId.startsWith("grammar.conditionals"))).toBe(true);
    expect(await learningContentMockAdapter.getActivityById("missing")).toBeNull();
    expect((await learningContentMockAdapter.getTaxonomyTree()).length).toBeGreaterThan(0);
  });

  it("supports category, both-level and unknown taxonomy filters", async () => {
    expect((await learningContentMockAdapter.listLessons({ category: "grammar" })).every((lesson) => lesson.category === "grammar")).toBe(true);
    await expect(learningContentMockAdapter.listActivities({ level: "both" })).resolves.toHaveLength(12);
    await expect(learningContentMockAdapter.listActivities({ taxonomyNodeId: "unknown" })).resolves.toEqual([]);
    await expect(learningContentMockAdapter.getLessonById("missing")).resolves.toBeNull();
  });
});
