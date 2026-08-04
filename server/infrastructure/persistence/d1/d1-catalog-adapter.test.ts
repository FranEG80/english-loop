import { describe, expect, it } from "vitest";
import { DatasetUnavailableException } from "@/core/shared/exceptions";
import type { D1Result } from "./types/binding";
import type { D1Operation } from "./types/operations";
import { D1CatalogAdapter } from "./d1-catalog-adapter";

const lessonRow = {
  id: "lesson-version-1", lessonId: "lesson-1", levelCode: "B1", category: "grammar", taxonomyNodeId: "grammar",
  title: "Grammar", summary: "Summary", explanation: "Explanation", examples: "[]", commonMistakes: "[]", tags: "[\"tag\"]",
  difficulty: 1, contentVersion: 1, statusCode: "published", relatedActivityIds: "[\"activity-1\",\"activity-1\"]",
};
const activityRow = {
  id: "activity-version-1", activityId: "activity-1", levelCode: "B1", activityTypeCode: "single_choice", category: "grammar",
  topic: "grammar", subtopic: "present", difficulty: 1, instructions: "Choose", prompt: "Prompt", passage: null,
  explanation: "Explanation", tags: "[]", lessonIds: "[\"lesson-1\"]", estimatedSeconds: 30,
  evaluatorData: JSON.stringify({ strategy: "exact_text", answer: "yes" }), statusCode: "published",
  options: JSON.stringify([{ optionId: "yes", label: "Yes", feedback: "Correct", position: 0 }]),
  tokens: "[]", pairs: "[]", lessonLinks: JSON.stringify([{ lessonId: "lesson-1", position: 0 }]),
  taxonomyLinks: JSON.stringify([{ taxonomyNodeId: "grammar", position: 0 }]),
};
const taxonomyRows = [
  { nodeId: "grammar", parentId: null, kind: "category", labelsEn: "Grammar", labelsEs: "Gramática", levels: "[\"B1\"]", selectableForPractice: 1, sortOrder: 0 },
  { nodeId: "present", parentId: "grammar", kind: "topic", labelsEn: "Present", labelsEs: "Presente", levels: "[\"B1\"]", selectableForPractice: 1, sortOrder: 0 },
];

function transport(overrides: Partial<Record<D1Operation["name"], D1Result>> = {}) {
  const calls: D1Operation[] = [];
  return {
    calls,
    execute: async (request: D1Operation) => {
      calls.push(request);
      const override = overrides[request.name];
      if (override) return override;
      if (request.name === "activeCatalogMetadata") return { success: true, results: [{ datasetVersion: "dataset-v1", checksum: "checksum" }] };
      if (request.name === "catalogLessons") return { success: true, results: [lessonRow] };
      if (request.name === "catalogActivities" || request.name === "activityById") return { success: true, results: [activityRow] };
      if (request.name === "catalogTaxonomy") return { success: true, results: taxonomyRows };
      if (request.name === "catalogCounts") return { success: true, results: [{ count: 1 }] };
      return { success: true, results: [] };
    },
    batch: async () => [],
  };
}

describe("D1CatalogAdapter", () => {
  it("reads published lessons, activities and metadata through typed operations", async () => {
    const base = transport();
    const catalog = new D1CatalogAdapter(base);
    await expect(catalog.listLessons({ level: "B1", category: "grammar" })).resolves.toMatchObject([{ id: "lesson-1", relatedActivityIds: ["activity-1"] }]);
    await expect(catalog.getLessonById("lesson-1")).resolves.toMatchObject({ id: "lesson-1" });
    await expect(catalog.listActivities({ level: "both", taxonomyNodeId: "grammar", lessonIds: ["lesson-1"] })).resolves.toMatchObject([{ id: "activity-1", options: [{ id: "yes", feedback: "Correct" }] }]);
    await expect(catalog.getActivityById("activity-1")).resolves.toMatchObject({ id: "activity-1" });
    await expect(catalog.countActivitiesByNode("grammar", "B1")).resolves.toBe(1);
    await expect(catalog.countActivitiesByNodes([], "B1")).resolves.toBe(0);
    await expect(catalog.countActivitiesByNodes(["grammar"], "both")).resolves.toBe(1);
    await expect(catalog.getContentVersion()).resolves.toMatchObject({ datasetVersion: "dataset-v1" });
    await expect(catalog.getCatalogMetadata()).resolves.toMatchObject({ lessonCount: 1, activityCount: 1, taxonomyNodeCount: 1 });
    expect(base.calls.some((request) => request.name === "catalogActivities")).toBe(true);
  });

  it("builds taxonomy descendants and paths and handles missing activities", async () => {
    const catalog = new D1CatalogAdapter(transport({ activityById: { success: true, results: [] } }));
    const tree = await catalog.getTaxonomyTree();
    expect(tree[0]?.children[0]?.id).toBe("present");
    await expect(catalog.resolveNodeWithDescendants("grammar")).resolves.toMatchObject([{ id: "grammar" }, { id: "present" }]);
    await expect(catalog.resolveNodeWithDescendants("missing")).resolves.toEqual([]);
    await expect(catalog.getNodePath("present")).resolves.toMatchObject([{ id: "grammar" }, { id: "present" }]);
    await expect(catalog.getNodePath("missing")).resolves.toEqual([]);
    await expect(catalog.getActivityById("missing")).resolves.toBeNull();
  });

  it("rejects reads when no published release is active", async () => {
    const catalog = new D1CatalogAdapter(transport({ activeCatalogMetadata: { success: true, results: [] } }));
    await expect(catalog.listLessons()).rejects.toBeInstanceOf(DatasetUnavailableException);
    await expect(catalog.getContentVersion()).resolves.toMatchObject({ datasetVersion: "unknown" });
  });
});
