// @vitest-environment node
import { describe, expect, it } from "vitest";
import path from "node:path";
import { FileTaxonomyCatalogAdapter } from "./file-taxonomy-catalog-adapter";

describe("FileTaxonomyCatalogAdapter", () => {
  it("resolves descendants, paths and dataset version", async () => {
    const adapter = new FileTaxonomyCatalogAdapter(path.join(process.cwd(), "DATASET"), "0.1.0");
    expect((await adapter.resolveNodeWithDescendants("grammar")).some((node) => node.id === "future-forms")).toBe(true);
    expect((await adapter.getNodePath("will-spontaneous-decisions")).map((node) => node.id)).toEqual(["grammar", "verb-tenses", "future-forms", "will-spontaneous-decisions"]);
    expect(await adapter.getNodePath("missing")).toEqual([]);
    expect(await adapter.getContentVersion()).toEqual({ datasetVersion: "0.1.0", schemaVersion: "1.0.0" });
  });
});
