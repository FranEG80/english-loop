import { describe, expect, it, vi } from "vitest";
import { getCatalogMetadata } from "./get-catalog-metadata";

describe("getCatalogMetadata", () => {
  it("returns the metadata supplied by the catalog port", async () => {
    const metadata = { datasetVersion: "v1", schemaVersion: "1.0.0", lessonCount: 2, activityCount: 4, taxonomyNodeCount: 3 };
    const port = { getCatalogMetadata: vi.fn(async () => metadata) };
    await expect(getCatalogMetadata(port)).resolves.toEqual(metadata);
    expect(port.getCatalogMetadata).toHaveBeenCalledOnce();
  });
});
