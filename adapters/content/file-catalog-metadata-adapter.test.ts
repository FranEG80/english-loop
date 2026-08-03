// @vitest-environment node
import { describe, expect, it } from "vitest";
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
});
