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
    } finally {
      await rm(datasetRoot, { recursive: true, force: true });
    }
  });
});
