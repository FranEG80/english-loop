import { describe, expect, it } from "vitest";
import { grade } from "./grading";
import type { ActivityResponse, Evaluator } from "./types";

const normalization = {
  trim: true,
  collapseWhitespace: true,
  caseSensitive: false,
  ignoreTerminalPunctuation: true,
  normaliseApostrophes: true,
};

describe("dataset grading", () => {
  const structuredCases: Array<[Evaluator, ActivityResponse, boolean]> = [
    [{ strategy: "boolean", correct: true }, true, true],
    [{ strategy: "boolean", correct: true }, false, false],
    [{ strategy: "single_option", correctOptionId: "a" }, "a", true],
    [{ strategy: "single_option", correctOptionId: "a" }, "b", false],
    [{ strategy: "multiple_options", correctOptionIds: ["a", "b"] }, ["b", "a"], true],
    [{ strategy: "multiple_options", correctOptionIds: ["a", "b"] }, ["a", "a"], false],
    [{ strategy: "ordered_tokens", correctTokenIds: ["a", "b"] }, ["a", "b"], true],
    [{ strategy: "ordered_tokens", correctTokenIds: ["a", "b"] }, ["b", "a"], false],
  ];

  it.each(structuredCases)("grades structured strategies", (evaluator, response, expected) => {
    expect(grade(evaluator, response)).toBe(expected);
  });

  it("supports text normalization and accepted alternatives", () => {
    expect(grade({ strategy: "exact_text", answer: "I've finished", normalization }, "  I’ve finished. ")).toBe(true);
    expect(grade({ strategy: "one_of_texts", answers: ["went", "have gone"], normalization }, "WENT")).toBe(true);
    expect(grade({ strategy: "one_of_texts", answers: ["went", "have gone"], normalization }, "go")).toBe(false);
  });

  it("requires every per-gap answer and rejects extra keys", () => {
    const evaluator = {
      strategy: "per_gap" as const,
      gaps: [
        { gapId: "first", answers: ["went"] },
        { gapId: "second", answers: ["home", "house"] },
      ],
      normalization,
    };
    expect(grade(evaluator, { first: "went", second: "HOUSE" })).toBe(true);
    expect(grade(evaluator, { first: "went" })).toBe(false);
    expect(grade(evaluator, { first: "went", second: "home", extra: "x" })).toBe(false);
  });

  it("checks unordered normalized sets and matching cardinality", () => {
    expect(grade({ strategy: "unordered_set", correctValues: ["red", "blue"], normalization }, [" BLUE ", "red"])).toBe(true);
    expect(grade({ strategy: "unordered_set", correctValues: ["red", "blue"], normalization }, ["red", "red"])).toBe(false);
    expect(grade({ strategy: "matching_pairs", pairs: [{ leftId: "l1", rightId: "r1" }] }, { l1: "r1" })).toBe(true);
    expect(grade({ strategy: "matching_pairs", pairs: [{ leftId: "l1", rightId: "r1" }] }, { l1: "r1", extra: "r2" })).toBe(false);
  });
});
