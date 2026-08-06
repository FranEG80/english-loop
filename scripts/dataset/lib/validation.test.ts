// @vitest-environment node
import { describe, expect, it } from "vitest";
import { loadDataset } from "./load";
import { validateDataset } from "./validation";

describe("dataset validation pipeline", () => {
  it("accepts the checked-in dataset with canonical lesson paths and taxonomy references", async () => {
    const issues = await validateDataset(await loadDataset());
    expect(issues).toEqual([]);
  });

  it("preserves the activity-format title on the reference lesson", async () => {
    const dataset = await loadDataset();
    const reference = dataset.lessons.find(
      (lesson) => lesson.frontmatter.id === "b2-advanced-grammar-reframing",
    );

    expect(reference?.frontmatter.title).toContain("Key word transformation");
    const issues = await validateDataset(dataset);
    expect(issues.some((issue) => issue.location === reference?.relativePath)).toBe(false);
  });

  it("requires structured cases in category-specific form and contrast sections", async () => {
    const dataset = await loadDataset();
    const target = dataset.lessons.find(
      (lesson) => lesson.frontmatter.id === "b1-collocations-daily-life",
    );
    expect(target).toBeDefined();
    if (!target) return;

    const broken = {
      ...dataset,
      lessons: dataset.lessons.map((lesson) =>
        lesson === target
          ? {
              ...lesson,
              content: lesson.content.replace(
                /# Patrones y combinaciones\n[\s\S]*?(?=\n# Contextos de uso)/u,
                "# Patrones y combinaciones\n\nPrimera combinación. Segunda combinación.\n",
              ),
            }
          : lesson,
      ),
    };
    const issues = await validateDataset(broken);
    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "lesson-structure", location: target.relativePath }),
      ]),
    );
  });

  it("allows optional recap sections to vary by lesson", async () => {
    const dataset = await loadDataset();
    const target = dataset.lessons.find(
      (lesson) => lesson.frontmatter.id === "b1-collocations-daily-life",
    );
    expect(target).toBeDefined();
    if (!target) return;

    const issues = await validateDataset({
      ...dataset,
      lessons: dataset.lessons.map((lesson) =>
        lesson === target
          ? {
              ...lesson,
              content: lesson.content.replace(
                /\n# Regla práctica\n[\s\S]*?(?=\n# Comprueba la colocación)/u,
                "",
              ),
            }
          : lesson,
      ),
    });

    expect(issues.some((issue) => issue.location === target.relativePath)).toBe(false);
  });

  it("rejects the repeated legacy template and explanations placed before uses", async () => {
    const dataset = await loadDataset();
    const target = dataset.lessons.find(
      (lesson) => lesson.frontmatter.id === "b1-reading-gist-detail",
    );
    expect(target).toBeDefined();
    if (!target) return;

    const explanation = target.content.match(
      /# Explicación\n[\s\S]*?(?=\n# Distractores y matices)/u,
    )?.[0];
    expect(explanation).toBeDefined();
    if (!explanation) return;

    const brokenContent = target.content
      .replace(`${explanation}\n\n`, "")
      .replace("# Pistas que debes localizar", `${explanation}\n\n## Procedimiento paso a paso\n\nTexto genérico.\n\n# Pistas que debes localizar`);
    const issues = await validateDataset({
      ...dataset,
      lessons: dataset.lessons.map((lesson) =>
        lesson === target ? { ...lesson, content: brokenContent } : lesson,
      ),
    });

    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "lesson-order", location: target.relativePath }),
        expect.objectContaining({ code: "lesson-template", location: target.relativePath }),
      ]),
    );
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

  it("rejects lesson cards that are named after activity formats", async () => {
    const dataset = await loadDataset();
    const target = dataset.lessons.find(
      (lesson) => lesson.frontmatter.id === "b2-connectors-cohesion",
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

    expect(issues.filter((issue) => issue.code === "lesson-focus").length).toBeGreaterThanOrEqual(2);
  });

  it("keeps renamed lessons aligned with their instructional topics", async () => {
    const dataset = await loadDataset();
    const renamedIds = [
      "b1-lexical-precision",
      "b1-grammar-reference-connectors",
      "b1-word-families",
      "b1-grammar-reframing",
      "b1-grammar-accuracy",
      "b1-reading-profile-requirements",
      "b1-reading-text-cohesion",
      "b2-collocations-fixed-expressions",
      "b2-lexical-precision",
      "b2-connectors-cohesion",
      "b2-word-families",
      "b2-register-politeness",
      "b2-reading-text-cohesion",
      "b2-reading-cross-text-comparison",
    ];
    const lessons = renamedIds.map((id) =>
      dataset.lessons.find((lesson) => lesson.frontmatter.id === id),
    );

    expect(lessons.every(Boolean)).toBe(true);
    for (const lesson of lessons) {
      if (!lesson) continue;
      expect(lesson.frontmatter.topic).toBe(lesson.frontmatter.id);
      expect(lesson.relativePath).toContain(`/${lesson.frontmatter.id}/${lesson.frontmatter.id}.md`);
      expect(lesson.frontmatter.title).not.toMatch(
        /open cloze|multiple[- ]choice cloze|key word transformations?|word formation|sentence rewriting|error correction|multiple matching|gapped text/iu,
      );
      expect(lesson.content).not.toMatch(
        /multiple[- ]choice cloze|open cloze|key word transformations?|word formation|sentence rewriting|error correction|multiple matching|gapped text|actividad autocorregible/iu,
      );
    }
  });
});
