import { describe, expect, it } from "vitest";
import type { LoadedDataset } from "./lib/types";
import { buildIndexes } from "./index";

describe("dataset indexes", () => {
  it("sorts lesson/activity rows and preserves their source metadata", () => {
    const dataset = {
      lessons: [
        { relativePath: "lessons/z.md", frontmatter: { id: "z", title: "Z", level: "B1", category: "grammar", topic: "topic", subtopics: [], difficulty: 1, estimatedMinutes: 5, status: "published", contentVersion: 1 } },
        { relativePath: "lessons/a.md", frontmatter: { id: "a", title: "A", level: "B2", category: "grammar", topic: "topic", subtopics: [], difficulty: 2, estimatedMinutes: 6, status: "draft", contentVersion: 2 } },
      ],
      batches: [{ relativePath: "activities/batch.json", batch: { batchId: "batch", activities: [{ id: "b", level: "B1", type: "true_false", category: "grammar", topic: "topic", subtopic: "subtopic", taxonomyNodeIds: ["topic"], lessonIds: ["a"], difficulty: 1, estimatedSeconds: 10, status: "published" }, { id: "a", level: "B1", type: "true_false", category: "grammar", topic: "topic", subtopic: "subtopic", taxonomyNodeIds: ["topic"], lessonIds: ["a"], difficulty: 1, estimatedSeconds: 10, status: "published" }] } }],
    } as unknown as LoadedDataset;
    const result = buildIndexes(dataset);
    expect(result.lessonIndex.lessons.map((item) => item.id)).toEqual(["a", "z"]);
    expect(result.activityIndex.activities.map((item) => item.id)).toEqual(["a", "b"]);
    expect(result.activityIndex.activities[0]?.batchId).toBe("batch");
  });
});
