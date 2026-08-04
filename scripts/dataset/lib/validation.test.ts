// @vitest-environment node
import { describe, expect, it } from "vitest";
import { loadDataset } from "./load";
import { validateDataset } from "./validation";

describe("dataset validation pipeline", () => {
  it("runs the checked-in validation pipeline and exposes unmet coverage as issues", async () => {
    const issues = await validateDataset(await loadDataset());
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.some((issue) => issue.code.includes("coverage"))).toBe(true);
    expect(issues.every((issue) => issue.location.length > 0 && issue.message.length > 0)).toBe(true);
  });

  it("reports a broken batch contract with a stable location and code", async () => {
    const dataset = await loadDataset();
    const first = dataset.batches[0];
    expect(first).toBeDefined();
    if (!first) return;
    const broken = {
      ...dataset,
      batches: [{
        ...first,
        batch: {
          ...first.batch,
          activities: [{ ...first.batch.activities[0], lessonIds: [] }, ...first.batch.activities.slice(1)],
        },
      }, ...dataset.batches.slice(1)],
    };
    const issues = await validateDataset(broken);
    expect(issues.some((issue) => issue.code === "batch-lesson" && issue.location.includes("#"))).toBe(true);
  });

  it("reports malformed lesson reference arrays without crashing the pipeline", async () => {
    const dataset = await loadDataset();
    const first = dataset.lessons[0];
    expect(first).toBeDefined();
    if (!first) return;
    const broken = {
      ...dataset,
      lessons: [{
        ...first,
        frontmatter: { ...first.frontmatter, prerequisites: null as never },
      }, ...dataset.lessons.slice(1)],
    };
    const issues = await validateDataset(broken);
    expect(issues.some((issue) => issue.code === "schema")).toBe(true);
  });
});
