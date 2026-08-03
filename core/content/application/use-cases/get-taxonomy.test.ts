import { describe, expect, it, vi } from "vitest";
import { getNodeWithDescendants, getTaxonomyNodePath, getTaxonomyTree } from "./get-taxonomy";
import type { TaxonomyNode } from "../../domain/taxonomy";
import type { TaxonomyCatalogPort } from "../../ports/catalog-ports";

const node: TaxonomyNode = { id: "topic", parentId: null, kind: "topic", labels: { en: "Topic", es: "Tema" }, levels: ["B1"], selectableForPractice: true, order: 0, children: [] };

describe("taxonomy catalog use cases", () => {
  it("delegates tree, descendants and paths", async () => {
    const catalog: TaxonomyCatalogPort = { getTaxonomyTree: vi.fn(async () => [node]), resolveNodeWithDescendants: vi.fn(async () => [node]), getNodePath: vi.fn(async () => [node]), getContentVersion: async () => ({ datasetVersion: "v1", schemaVersion: "1.0.0" }) };
    expect(await getTaxonomyTree(catalog)).toEqual([node]);
    expect(await getNodeWithDescendants(catalog, "topic")).toEqual([node]);
    expect(await getTaxonomyNodePath(catalog, "topic")).toEqual([node]);
    expect(catalog.resolveNodeWithDescendants).toHaveBeenCalledWith("topic");
    expect(catalog.getNodePath).toHaveBeenCalledWith("topic");
  });
});
