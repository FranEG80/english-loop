import { describe, expect, it } from "vitest";
import type { TaxonomyNodeDto } from "@/core/models";
import { findTaxonomyNode, taxonomyLabel } from "./taxonomy";

const nodes: TaxonomyNodeDto[] = [{ id: "root", type: "category", label: { en: "Root", es: "Raíz" }, levels: ["B1"], children: [{ id: "child", type: "topic", label: { en: "Child", es: "Hijo" }, levels: ["B1"], children: [] }] }];

describe("taxonomy helpers", () => {
  it("searches recursively and falls back to an unknown id", () => {
    expect(findTaxonomyNode(nodes, "child")?.label.en).toBe("Child");
    expect(findTaxonomyNode(nodes, "missing")).toBeNull();
    expect(taxonomyLabel(nodes, "child", "es")).toBe("Hijo");
    expect(taxonomyLabel(nodes, "missing", "en")).toBe("missing");
  });
});
