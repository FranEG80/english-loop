import { describe, expect, it } from "vitest";
import { acceptedVariants, correctResponse, incorrectResponse, textVariants } from "./test-grading";

const normalization = { trim: true, collapseWhitespace: true, caseSensitive: false, ignoreTerminalPunctuation: true, normaliseApostrophes: true };

describe("dataset grading command helpers", () => {
  it("builds correct and incorrect examples for every evaluator family", () => {
    const evaluators = [
      { strategy: "boolean" as const, correct: true },
      { strategy: "single_option" as const, correctOptionId: "a" },
      { strategy: "multiple_options" as const, correctOptionIds: ["a", "b"] },
      { strategy: "exact_text" as const, answer: "done", normalization },
      { strategy: "one_of_texts" as const, answers: ["done"], normalization },
      { strategy: "per_gap" as const, gaps: [{ gapId: "one", answers: ["done"] }], normalization },
      { strategy: "ordered_tokens" as const, correctTokenIds: ["a", "b"] },
      { strategy: "unordered_set" as const, correctValues: ["a", "b"], normalization },
      { strategy: "matching_pairs" as const, pairs: [{ leftId: "l", rightId: "r" }] },
    ];
    for (const evaluator of evaluators) {
      expect(correctResponse(evaluator)).toBeDefined();
      expect(incorrectResponse(evaluator)).toBeDefined();
    }
  });

  it("generates only configured accepted text variants", () => {
    expect(textVariants("I'm ready", normalization)).toEqual(expect.arrayContaining(["  I'm ready  ", "I'M READY", "I'm ready.", "I’m ready"]));
    expect(acceptedVariants({ strategy: "one_of_texts", answers: ["done"], normalization })).toEqual(expect.arrayContaining(["  done  ", "DONE", "done."]));
  });
});
