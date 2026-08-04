// @vitest-environment node
import { describe, expect, it } from "vitest";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { FileCatalogMetadataAdapter } from "./file-catalog-metadata-adapter";

describe("FileCatalogMetadataAdapter", () => {
  it("caches deterministic metadata and exposes non-zero catalog counts", async () => {
    const adapter = new FileCatalogMetadataAdapter(path.join(process.cwd(), "DATASET"));
    const first = await adapter.getCatalogMetadata();
    expect(await adapter.getCatalogMetadata()).toBe(first);
    expect(first.datasetVersion).toBe("0.1.0");
    expect(first.lessonCount).toBeGreaterThan(0);
    expect(first.activityCount).toBeGreaterThan(0);
    expect(first.taxonomyNodeCount).toBeGreaterThan(0);
  });

  it("uses zero counts for optional arrays and preserves dataset errors", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "english-loop-metadata-"));
    try {
      await mkdir(path.join(root, "catalog"), { recursive: true });
      await writeFile(path.join(root, "catalog/lesson-index.json"), JSON.stringify({ generatedFromDatasetVersion: "temp", schemaVersion: "1", lessons: undefined }));
      await writeFile(path.join(root, "catalog/activity-index.json"), JSON.stringify({ generatedFromDatasetVersion: "temp", schemaVersion: "1" }));
      await writeFile(path.join(root, "catalog/taxonomy.json"), JSON.stringify({ schemaVersion: "1", nodes: [] }));
      await expect(new FileCatalogMetadataAdapter(root).getCatalogMetadata()).resolves.toEqual({ datasetVersion: "temp", schemaVersion: "1", lessonCount: 0, activityCount: 0, taxonomyNodeCount: 0 });
      await expect(new FileCatalogMetadataAdapter(path.join(root, "missing")).getCatalogMetadata()).rejects.toBeInstanceOf(Error);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
