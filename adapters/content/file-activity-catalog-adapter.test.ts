// @vitest-environment node
import { describe, expect, it } from "vitest";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { FileActivityCatalogAdapter } from "./file-activity-catalog-adapter";

describe("FileActivityCatalogAdapter", () => {
  it("filters published activities and counts taxonomy descendants", async () => {
    const datasetRoot = await mkdtemp(path.join(os.tmpdir(), "english-loop-activity-catalog-"));
    try {
      const batchPath = "activities/b1/test/batch-001.json";
      await mkdir(path.join(datasetRoot, path.dirname(batchPath)), { recursive: true });
      await mkdir(path.join(datasetRoot, "catalog"), { recursive: true });
      await writeFile(path.join(datasetRoot, "catalog/activity-index.json"), JSON.stringify({
        schemaVersion: "1.0.0",
        generatedFromDatasetVersion: "test",
        activities: [
          {
            id: "activity-b1",
            batchId: "batch-001",
            path: batchPath,
            level: "B1",
            type: "fill_blank",
            category: "grammar",
            topic: "test",
            subtopic: "ability-permission",
            taxonomyNodeIds: ["ability-permission"],
            lessonIds: ["lesson-1"],
            difficulty: 1,
            estimatedSeconds: 30,
            status: "published",
          },
          {
            id: "activity-draft",
            batchId: "batch-001",
            path: batchPath,
            level: "B1",
            type: "fill_blank",
            category: "grammar",
            topic: "test",
            subtopic: "ability-permission",
            taxonomyNodeIds: ["ability-permission"],
            lessonIds: ["lesson-1"],
            difficulty: 1,
            estimatedSeconds: 30,
            status: "draft",
          },
        ],
      }));
      await writeFile(path.join(datasetRoot, batchPath), JSON.stringify({
        schemaVersion: "1.0.0",
        batchId: "batch-001",
        activities: [{
          id: "activity-b1",
          versionId: "activity-b1-v1",
          level: "B1",
          type: "fill_blank",
          category: "grammar",
          topic: "test",
          subtopic: "ability-permission",
          taxonomyNodeIds: ["ability-permission"],
          difficulty: 1,
          instructions: "Complete the sentence",
          prompt: "I ___ English.",
          lessonIds: ["lesson-1"],
          tags: [],
          estimatedSeconds: 30,
          evaluator: { strategy: "exact_text", answer: "speak", normalization: { trim: true, collapseWhitespace: true, caseSensitive: false, ignoreTerminalPunctuation: true, normaliseApostrophes: true } },
          explanation: "Use the present simple.",
          status: "published",
        }],
      }));

      const adapter = new FileActivityCatalogAdapter(datasetRoot);
      const b1 = await adapter.listActivities({ level: "B1" });
      const both = await adapter.listActivities({ level: "both" });
      expect(b1).toHaveLength(1);
      expect(both).toHaveLength(1);
      expect(await adapter.countActivitiesByNodes(["ability-permission"], "B1")).toBe(1);
      expect(await adapter.getActivityById("missing")).toBeNull();
      await expect(adapter.getActivityByVersionId("activity-b1-v1")).resolves.toMatchObject({ id: "activity-b1", versionId: "activity-b1-v1" });
      await expect(adapter.getActivityByVersionId("missing-version")).resolves.toBeNull();
      const firstPage = await adapter.listActivitiesPage(undefined, { limit: 1 });
      expect(firstPage.items).toHaveLength(1);
      expect(firstPage.hasMore).toBe(false);
    } finally {
      await rm(datasetRoot, { recursive: true, force: true });
    }
  });

  it("handles all filters, batch caching and unavailable files", async () => {
    const datasetRoot = await mkdtemp(path.join(os.tmpdir(), "english-loop-activity-catalog-errors-"));
    try {
      await mkdir(path.join(datasetRoot, "catalog"), { recursive: true });
      await writeFile(path.join(datasetRoot, "catalog/activity-index.json"), JSON.stringify({ activities: [
        { id: "a1", batchId: "b1", path: "a.json", level: "B1", type: "fill_blank", category: "grammar", topic: "t", subtopic: "s", taxonomyNodeIds: ["n1"], lessonIds: ["l1"], difficulty: 1, estimatedSeconds: 1, status: "published" },
        { id: "a2", batchId: "b2", path: "b.json", level: "B2", type: "fill_blank", category: "grammar", topic: "t", subtopic: "s", taxonomyNodeIds: ["n2"], lessonIds: ["l2"], difficulty: 1, estimatedSeconds: 1, status: "published" },
        { id: "a3", batchId: "b3", path: "c.json", level: "B1", type: "fill_blank", category: "grammar", topic: "t", subtopic: "s", taxonomyNodeIds: ["n3"], lessonIds: ["l3"], difficulty: 1, estimatedSeconds: 1, status: "published" },
      ] }));
      const activity = (id: string, status = "published") => ({ id, level: id === "a1" ? "B1" : "B2", type: "fill_blank", category: "grammar", topic: "t", subtopic: "s", taxonomyNodeIds: [id === "a1" ? "n1" : "n2"], difficulty: 1, instructions: "", prompt: "", lessonIds: [id === "a1" ? "l1" : "l2"], tags: [], estimatedSeconds: 1, evaluator: { strategy: "exact_text", answer: "" }, explanation: "", status });
      await writeFile(path.join(datasetRoot, "a.json"), JSON.stringify({ activities: [activity("a1"), activity("draft", "draft")] }));
      await writeFile(path.join(datasetRoot, "b.json"), JSON.stringify({ activities: [activity("a2")] }));
      await writeFile(path.join(datasetRoot, "c.json"), JSON.stringify({ activities: [] }));
      const adapter = new FileActivityCatalogAdapter(datasetRoot);
      await expect(adapter.listActivities({ level: "B2", taxonomyNodeId: "n2", lessonIds: ["l2"] })).resolves.toMatchObject([{ id: "a2" }]);
      await expect(adapter.listActivities({ level: "B1", taxonomyNodeId: "missing" })).resolves.toEqual([]);
      await expect(adapter.listActivities({ lessonIds: ["missing"] })).resolves.toEqual([]);
      await expect(adapter.getActivityById("a1")).resolves.toMatchObject({ id: "a1" });
      await expect(adapter.getActivityById("missing")).resolves.toBeNull();
      await expect(adapter.countActivitiesByNode("n1", "both")).resolves.toBe(1);
      await expect(adapter.countActivitiesByNodes(["n2"], "B1")).resolves.toBe(0);
      await expect(adapter.listActivitiesPage({ level: "B2" }, { limit: 2 })).resolves.toMatchObject({ items: [{ id: "a2" }] });
      await expect(adapter.listActivitiesPage({ level: "B1" }, { limit: 1 })).resolves.toMatchObject({ items: [{ id: "a1" }] });
      await expect(adapter.listActivitiesPage({ taxonomyNodeId: "n2" }, { limit: 2 })).resolves.toMatchObject({ items: [{ id: "a2" }] });
      await expect(adapter.listActivitiesPage({ lessonIds: ["l2"] }, { limit: 2 })).resolves.toMatchObject({ items: [{ id: "a2" }] });
      await expect(adapter.listActivitiesPage({ lessonIds: ["l3"] }, { limit: 2 })).resolves.toMatchObject({ items: [], hasMore: false });
      await expect(adapter.searchActivitiesPage({ query: "a2", taxonomyNodeIds: ["n2"], activityType: "fill_blank", presentation: "gap_fill" }, { page: 1, pageSize: 1 })).resolves.toMatchObject({ items: [{ id: "a2" }], total: 1, totalPages: 1 });
      await expect(adapter.getActivityById("a3")).resolves.toBeNull();
    } finally {
      await rm(datasetRoot, { recursive: true, force: true });
    }
  });

  it("reports malformed indexes and batches as dataset outages", async () => {
    const datasetRoot = await mkdtemp(path.join(os.tmpdir(), "english-loop-activity-catalog-invalid-"));
    try {
      const adapter = new FileActivityCatalogAdapter(datasetRoot);
      await expect(adapter.listActivities()).rejects.toBeInstanceOf(Error);
      await mkdir(path.join(datasetRoot, "catalog"), { recursive: true });
      await writeFile(path.join(datasetRoot, "catalog/activity-index.json"), JSON.stringify({ activities: [{ id: "a", batchId: "b", path: "missing.json", level: "B1", type: "fill_blank", taxonomyNodeIds: [], lessonIds: [], status: "published" }] }));
      const missingBatch = new FileActivityCatalogAdapter(datasetRoot);
      await expect(missingBatch.getActivityById("a")).rejects.toBeInstanceOf(Error);
    } finally {
      await rm(datasetRoot, { recursive: true, force: true });
    }
  });
});
