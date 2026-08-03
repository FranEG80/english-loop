import { describe, expect, it } from "vitest";
import type { Activity } from "./lib/types";
import { findDuplicates } from "./duplicates";

function item(id: string, prompt: string): Activity {
  return { id, prompt, level: "B1", type: "true_false", topic: "topic" } as Activity;
}

describe("findDuplicates", () => {
  it("finds exact normalized groups and near duplicates deterministically", () => {
    const result = findDuplicates([item("b", "Hello world"), item("a", " hello   world "), item("c", "Hello world today")]);
    expect(result.exact).toEqual([{ normalisedPrompt: "hello world", activityIds: ["a", "b"] }]);
    expect(result.nearDuplicateThreshold).toBe(0.86);
    expect(result.near).toEqual([]);
  });
});
