import { describe, expect, it } from "vitest";
import {
  catalogSearchTerms,
  matchesCatalogSearch,
  numberedPage,
} from "./catalog-search";

describe("catalog search", () => {
  it("normalises accents and catalog ID separators", () => {
    expect(catalogSearchTerms("B2 use_of-English — transformación")).toEqual([
      "b2",
      "use",
      "of",
      "english",
      "transformacion",
    ]);
    expect(
      matchesCatalogSearch(
        ["b2-use-of-english-key-word-transformations"],
        "key word transformations",
      ),
    ).toBe(true);
  });

  it("builds numbered pagination metadata", () => {
    expect(numberedPage(["item"], 25, 2, 12)).toEqual({
      items: ["item"],
      page: 2,
      pageSize: 12,
      total: 25,
      totalPages: 3,
      hasNextPage: true,
      hasPreviousPage: true,
    });
  });
});
