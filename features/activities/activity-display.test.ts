import { describe, expect, it } from "vitest";
import { formatActivityTitle, formatActivityType } from "./activity-display";

describe("activity display labels", () => {
  it("removes internal level and format prefixes from activity titles", () => {
    expect(formatActivityTitle("b1-fixed-expressions-sc-002", "B1")).toBe(
      "Fixed Expressions",
    );
  });

  it("uses human-readable labels for activity types", () => {
    expect(formatActivityType("single_choice")).toBe("Single choice");
    expect(formatActivityType("key_word_transformation")).toBe(
      "Keyword transformation",
    );
  });
});
