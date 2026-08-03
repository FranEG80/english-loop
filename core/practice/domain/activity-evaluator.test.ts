import { describe, expect, it } from "vitest";
import { evaluate } from "@/core/practice/domain/activity-evaluator";
import type { Evaluator } from "@/core/content/domain/activity";

const normalization = {
  trim: true,
  collapseWhitespace: true,
  caseSensitive: false,
  ignoreTerminalPunctuation: true,
  normaliseApostrophes: true,
};

describe("ActivityEvaluator", () => {
  it("grades boolean strategy", () => {
    const evaluator: Evaluator = { strategy: "boolean", correct: true };
    expect(evaluate(evaluator, { kind: "boolean", value: true })).toBe(true);
    expect(evaluate(evaluator, { kind: "boolean", value: false })).toBe(false);
  });

  it("grades single_option strategy", () => {
    const evaluator: Evaluator = {
      strategy: "single_option",
      correctOptionId: "a",
    };
    expect(evaluate(evaluator, { kind: "single", value: "a" })).toBe(true);
    expect(evaluate(evaluator, { kind: "single", value: "b" })).toBe(false);
  });

  it("grades multiple_options strategy", () => {
    const evaluator: Evaluator = {
      strategy: "multiple_options",
      correctOptionIds: ["a", "b"],
    };
    expect(
      evaluate(evaluator, { kind: "multiple", value: ["a", "b"] }),
    ).toBe(true);
    expect(
      evaluate(evaluator, { kind: "multiple", value: ["a", "c"] }),
    ).toBe(false);
    expect(
      evaluate(evaluator, { kind: "multiple", value: ["a", "a", "b"] }),
    ).toBe(false);
    expect(
      evaluate(evaluator, { kind: "text", value: "a" }),
    ).toBe(false);
  });

  it("grades exact_text with normalization", () => {
    const evaluator: Evaluator = {
      strategy: "exact_text",
      answer: "I have lived here",
      normalization,
    };
    expect(
      evaluate(evaluator, { kind: "text", value: "  I have lived here.  " }),
    ).toBe(true);
    expect(
      evaluate(evaluator, { kind: "text", value: "I live here" }),
    ).toBe(false);
  });

  it("grades one_of_texts strategy", () => {
    const evaluator: Evaluator = {
      strategy: "one_of_texts",
      answers: ["went", "have gone"],
      normalization,
    };
    expect(evaluate(evaluator, { kind: "text", value: "WENT" })).toBe(true);
    expect(evaluate(evaluator, { kind: "text", value: "go" })).toBe(false);
  });

  it("grades per_gap responses against an accepted answer", () => {
    const evaluator: Evaluator = {
      strategy: "per_gap",
      gaps: [
        { gapId: "first", answers: ["went"] },
        { gapId: "second", answers: ["home", "house"] },
      ],
      normalization,
    };
    expect(evaluate(evaluator, { kind: "text", value: " HOUSE " })).toBe(true);
    expect(evaluate(evaluator, { kind: "text", value: "school" })).toBe(false);
    expect(evaluate(evaluator, { kind: "multiple", value: ["house"] })).toBe(false);
  });

  it("grades ordered_tokens strategy", () => {
    const evaluator: Evaluator = {
      strategy: "ordered_tokens",
      correctTokenIds: ["t1", "t2", "t3"],
    };
    expect(
      evaluate(evaluator, { kind: "ordered_list", value: ["t1", "t2", "t3"] }),
    ).toBe(true);
    expect(
      evaluate(evaluator, { kind: "ordered_list", value: ["t3", "t2", "t1"] }),
    ).toBe(false);
  });

  it("grades unordered_set strategy", () => {
    const evaluator: Evaluator = {
      strategy: "unordered_set",
      correctValues: ["apple", "banana"],
      normalization,
    };
    expect(
      evaluate(evaluator, { kind: "multiple", value: ["banana", "apple"] }),
    ).toBe(true);
    expect(
      evaluate(evaluator, { kind: "multiple", value: ["apple", "pear"] }),
    ).toBe(false);
  });

  it("grades matching_pairs strategy", () => {
    const evaluator: Evaluator = {
      strategy: "matching_pairs",
      pairs: [
        { leftId: "l1", rightId: "r1" },
        { leftId: "l2", rightId: "r2" },
      ],
    };
    expect(
      evaluate(evaluator, {
        kind: "pairs",
        value: [
          { leftId: "l1", rightId: "r1" },
          { leftId: "l2", rightId: "r2" },
        ],
      }),
    ).toBe(true);
    expect(
      evaluate(evaluator, {
        kind: "pairs",
        value: [
          { leftId: "l1", rightId: "r2" },
          { leftId: "l2", rightId: "r1" },
        ],
      }),
    ).toBe(false);
    expect(
      evaluate(evaluator, {
        kind: "pairs",
        value: [
          { leftId: "l1", rightId: "r1" },
          { leftId: "l1", rightId: "r1" },
        ],
      }),
    ).toBe(false);
  });

  it("rejects an unknown evaluator strategy safely", () => {
    expect(() =>
      evaluate(
        { strategy: "future_strategy" } as unknown as Evaluator,
        { kind: "boolean", value: true },
      ),
    ).toThrow("Unsupported evaluator strategy");
  });
});
