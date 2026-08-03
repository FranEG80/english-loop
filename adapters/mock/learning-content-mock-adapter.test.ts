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
});
