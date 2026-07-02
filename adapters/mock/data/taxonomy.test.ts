import { describe, expect, it } from "vitest";
import {
  collectDescendantIds,
  findTaxonomyNode,
  findTaxonomyPath,
  mockTaxonomyTree,
} from "./taxonomy";

describe("mock taxonomy tree", () => {
  it("finds a nested skill node by id", () => {
    const node = findTaxonomyNode(
      "grammar.verb-tenses.future.will-vs-going-to",
    );
    expect(node?.type).toBe("skill");
  });

  it("collects all descendant ids of a category", () => {
    const grammar = mockTaxonomyTree.find((node) => node.id === "grammar");
    const ids = grammar ? collectDescendantIds(grammar) : [];
    expect(ids).toContain("grammar.conditionals.first");
  });

  it("builds the root-to-node path", () => {
    const path = findTaxonomyPath("grammar.verb-tenses.past.simple");
    expect(path).toEqual([
      "grammar",
      "grammar.verb-tenses",
      "grammar.verb-tenses.past",
      "grammar.verb-tenses.past.simple",
    ]);
  });
});
