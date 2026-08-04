import { describe, expect, it } from "vitest";
import { buildCatalogSeedInput } from "./seed";
import type { LoadedDataset } from "./lib/types";

describe("dataset seed mapping", () => {
  it("maps Markdown lesson sources and JSON activity sources to the catalog port", () => {
    const dataset = {
      lessons: [
        {
          filePath: "DATASET/lessons/b1/grammar/lesson.md",
          relativePath: "lessons/b1/grammar/lesson.md",
          frontmatter: {
            schemaVersion: "1.0.0",
            id: "lesson-1",
            title: "A lesson",
            level: "B1",
            category: "grammar",
            topic: "b1-grammar",
            subtopics: ["b1-grammar-topic"],
            difficulty: 2,
            estimatedMinutes: 20,
            learningObjectives: [],
            prerequisites: ["lesson-0"],
            frameworkRefs: [],
            relatedLessonIds: [],
            tags: ["grammar"],
            status: "published",
            author: "test",
            reviewer: "test",
            contentVersion: 1,
          },
          content: "# Resumen\n\nMarkdown summary.\n\nSecond paragraph.",
        },
      ],
      batches: [],
      activities: [
        {
          schemaVersion: "1.0.0",
          id: "activity-1",
          status: "published",
          autoGradable: true,
          level: "B1",
          type: "fill_blank",
          category: "grammar",
          topic: "b1-grammar",
          subtopic: "b1-grammar-topic",
          taxonomyNodeIds: ["b1-grammar-topic"],
          difficulty: 2,
          instructions: "Complete the sentence.",
          prompt: "I have lived here __ 2020.",
          lessonIds: ["lesson-1"],
          tags: ["grammar"],
          estimatedSeconds: 30,
          evaluator: {
            strategy: "exact_text",
            answer: "since",
            normalization: {
              trim: true,
              collapseWhitespace: true,
              caseSensitive: false,
              ignoreTerminalPunctuation: true,
              normaliseApostrophes: true,
            },
          },
          explanation: "Use since with a starting point.",
        },
      ],
      taxonomy: {
        schemaVersion: "1.0.0",
        nodes: [
          {
            id: "b1-grammar-topic",
            parentId: null,
            kind: "topic",
            labels: { en: "Grammar", es: "Gramática" },
            levels: ["B1"],
            selectableForPractice: true,
            order: 1,
          },
        ],
      },
      coverageTargets: { schemaVersion: "1.0.0", global: { minimumLessons: 0, minimumActivities: 0 }, nodes: [] },
      curriculumMap: { schemaVersion: "1.0.0", auditNotes: [], units: [] },
      sources: { schemaVersion: "1.0.0", consultedAt: "2026-01-01", sources: [] },
    } as LoadedDataset;

    const input = buildCatalogSeedInput(dataset, "2026.08");

    expect(input.lessons).toMatchObject([{
      id: "lesson-1",
      taxonomyNodeId: "b1-grammar-topic",
      prerequisiteLessonIds: ["lesson-0"],
      title: "A lesson",
      summary: "Markdown summary. Second paragraph.",
      explanation: "# Resumen\n\nMarkdown summary.\n\nSecond paragraph.",
    }]);
    expect(input.activities).toMatchObject([{
      id: "activity-1",
      lessonIds: ["lesson-1"],
      evaluatorStrategy: "exact_text",
      expectedAnswers: [{ gapId: null, answer: "since", position: 0 }],
    }]);
    expect(input.datasetVersion).toBe("2026.08");
    expect(input.checksum).toMatch(/^[a-f0-9]{64}$/);
  });
});
