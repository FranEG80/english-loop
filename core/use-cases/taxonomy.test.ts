import { describe, expect, it } from "vitest";
import { findTaxonomyNode, taxonomyLabel } from "./taxonomy";

const nodes = [{ id: "root", type: "category" as const, label: { en: "Root", es: "Raíz" }, levels: ["B1"] as const, children: [{ id: "child", type: "topic" as const, label: { en: "Child", es: "Hijo" }, levels: ["B1"] as const, children: [] }] }];

describe("taxonomy helpers", () => {
  it("searches recursively and falls back to an unknown id", () => {
    expect(findTaxonomyNode(nodes, "child")?.label.en).toBe("Child");
    expect(findTaxonomyNode(nodes, "missing")).toBeNull();
    expect(taxonomyLabel(nodes, "child", "es")).toBe("Hijo");
    expect(taxonomyLabel(nodes, "missing", "en")).toBe("missing");
  });
});
