import { describe, expect, it } from "vitest";
import { toTaxonomyNodeDto } from "./taxonomy-mapper";

describe("toTaxonomyNodeDto", () => {
  it("recursively maps labels, levels and children", () => {
    const dto = toTaxonomyNodeDto({
      id: "grammar",
      parentId: null,
      kind: "category",
      labels: { en: "Grammar", es: "Gramática" },
      levels: ["B1", "B2"],
      selectableForPractice: true,
      order: 0,
      children: [{
        id: "tenses",
        parentId: "grammar",
        kind: "topic",
        labels: { en: "Tenses", es: "Tiempos" },
        levels: ["B1"],
        selectableForPractice: true,
        order: 0,
        children: [],
      }],
    });
    expect(dto).toEqual({
      id: "grammar",
      type: "category",
      label: { en: "Grammar", es: "Gramática" },
      levels: ["B1", "B2"],
      children: [{ id: "tenses", type: "topic", label: { en: "Tenses", es: "Tiempos" }, levels: ["B1"], children: [] }],
    });
  });
});
