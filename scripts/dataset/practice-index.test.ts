import { describe, expect, it } from "vitest";
import type { Activity, TaxonomyNode } from "./lib/types";
import { buildChildren, collectDescendants, countBy, uniqueActivities } from "./practice-index";

describe("practice-index helpers", () => {
  it("sorts descendants, deduplicates activities and counts dimensions", () => {
    const nodes: TaxonomyNode[] = [
      { id: "root", parentId: null, kind: "category", labels: { en: "Root", es: "Raíz" }, levels: ["B1"], selectableForPractice: true, order: 0 },
      { id: "z", parentId: "root", kind: "skill", labels: { en: "Z", es: "Z" }, levels: ["B1"], selectableForPractice: true, order: 0 },
      { id: "a", parentId: "root", kind: "skill", labels: { en: "A", es: "A" }, levels: ["B1"], selectableForPractice: true, order: 0 },
    ];
    const children = buildChildren(nodes);
    expect(collectDescendants("root", children)).toEqual(["a", "z"]);
    const values = [{ id: "b", level: "B1", difficulty: 1 }, { id: "a", level: "B2", difficulty: 2 }, { id: "b", level: "B1", difficulty: 1 }] as Activity[];
    expect(uniqueActivities(values).map((item) => item.id)).toEqual(["a", "b"]);
    expect(countBy(values, (item) => item.level)).toEqual({ B1: 2, B2: 1 });
  });
});
