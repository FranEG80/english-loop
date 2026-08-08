import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { evaluate } from "./activity-evaluator";
import type { Evaluator } from "@/core/content/domain/types/activity";

const normalization = {
  trim: true,
  collapseWhitespace: true,
  caseSensitive: false,
  ignoreTerminalPunctuation: true,
  normaliseApostrophes: true,
};

const word = fc.stringMatching(/^[a-z]{1,10}$/u);

describe("activity evaluator properties", () => {
  it("accepts normalized exact-text variants for every generated phrase", () => {
    fc.assert(
      fc.property(fc.array(word, { minLength: 1, maxLength: 4 }), (words) => {
        const answer = words.join(" ");
        const evaluator: Evaluator = { strategy: "exact_text", answer, normalization };
        const variant = `  ${answer.toUpperCase()}!!!  `;
        expect(evaluate(evaluator, { kind: "text", value: variant }).isCorrect).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  it("keeps multiple-option grading permutation-invariant and duplicate-sensitive", () => {
    fc.assert(
      fc.property(fc.uniqueArray(word, { minLength: 1, maxLength: 5 }), (values) => {
        const evaluator: Evaluator = { strategy: "multiple_options", correctOptionIds: values };
        expect(evaluate(evaluator, { kind: "multiple", value: [...values].reverse() }).isCorrect).toBe(true);
        expect(evaluate(evaluator, { kind: "multiple", value: [...values, values[0]!] }).isCorrect).toBe(false);
      }),
      { numRuns: 100 },
    );
  });
});
