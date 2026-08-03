import { describe, expect, it } from "vitest";
import type { Activity, TaxonomyNode } from "./lib/types";
import { buildChildren, collectDescendants, countBy } from "./coverage";

const nodes: TaxonomyNode[] = [
  { id: "root", parentId: null, kind: "category", labels: { en: "Root", es: "Raíz" }, levels: ["B1"], selectableForPractice: true, order: 0 },
  { id: "child", parentId: "root", kind: "topic", labels: { en: "Child", es: "Hijo" }, levels: ["B1"], selectableForPractice: true, order: 0 },
  { id: "leaf", parentId: "child", kind: "skill", labels: { en: "Leaf", es: "Hoja" }, levels: ["B1"], selectableForPractice: true, order: 0 },
];

describe("coverage helpers", () => {
  it("builds descendants recursively and counts sorted dimensions", () => {
    const children = buildChildren(nodes);
    expect(collectDescendants("root", children)).toEqual(["child", "leaf"]);
    expect(countBy([{ level: "B1" }, { level: "B2" }, { level: "B1" }] as Activity[], (item) => item.level)).toEqual({ B1: 2, B2: 1 });
  });
});
