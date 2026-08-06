// @vitest-environment node
import { describe, expect, it } from "vitest";
import { loadDataset } from "./load";
import { validateDataset } from "./validation";

describe("dataset validation pipeline", () => {
  it("accepts the checked-in dataset with canonical lesson paths and taxonomy references", async () => {
    const issues = await validateDataset(await loadDataset());
    expect(issues).toEqual([]);
  });

  it("runs the checked-in validation pipeline and exposes unmet coverage as issues", async () => {
    const dataset = await loadDataset();
    const issues = await validateDataset({
      ...dataset,
      coverageTargets: {
        ...dataset.coverageTargets,
        global: {
          ...dataset.coverageTargets.global,
          minimumLessons: dataset.lessons.length + dataset.coverageTargets.global.minimumLessons + 1,
        },
      },
    });
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

  it("rejects B2 lesson cards that are named after activity formats", async () => {
    const dataset = await loadDataset();
    const target = dataset.lessons.find(
      (lesson) => lesson.frontmatter.id === "b2-use-of-english-open-cloze",
    );
    expect(target).toBeDefined();
    if (!target) return;

    const broken = {
      ...target,
      frontmatter: {
        ...target.frontmatter,
        title: "Open cloze B2: completar huecos",
      },
      content: target.content.replace(
        /# Resumen\n[\s\S]*?(?=\n# Objetivos)/u,
        "# Resumen\n\nEn un open cloze se completa un texto.\n",
      ),
    };
    const issues = await validateDataset({
      ...dataset,
      lessons: dataset.lessons.map((lesson) =>
        lesson === target ? broken : lesson,
      ),
    });

    expect(issues.filter((issue) => issue.code === "lesson-focus")).toHaveLength(2);
  });
});
