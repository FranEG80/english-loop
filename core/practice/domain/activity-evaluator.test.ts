import { describe, expect, it } from "vitest";
import { evaluate } from "@/core/practice/domain/activity-evaluator";
import type { Evaluator } from "@/core/content/domain/types/activity";

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
    expect(evaluate(evaluator, { kind: "boolean", value: true }).isCorrect).toBe(true);
    expect(evaluate(evaluator, { kind: "boolean", value: false }).isCorrect).toBe(false);
  });

  it("grades single_option strategy", () => {
    const evaluator: Evaluator = {
      strategy: "single_option",
      correctOptionId: "a",
    };
    expect(evaluate(evaluator, { kind: "single", value: "a" }).isCorrect).toBe(true);
    expect(evaluate(evaluator, { kind: "single", value: "b" }).isCorrect).toBe(false);
  });

  it("grades multiple_options strategy", () => {
    const evaluator: Evaluator = {
      strategy: "multiple_options",
      correctOptionIds: ["a", "b"],
    };
    expect(
      evaluate(evaluator, { kind: "multiple", value: ["a", "b"] }).isCorrect,
    ).toBe(true);
    expect(
      evaluate(evaluator, { kind: "multiple", value: ["a", "c"] }).isCorrect,
    ).toBe(false);
    expect(
      evaluate(evaluator, { kind: "multiple", value: ["a", "a", "b"] }).isCorrect,
    ).toBe(false);
    expect(
      evaluate(evaluator, { kind: "text", value: "a" }).isCorrect,
    ).toBe(false);
  });

  it("grades exact_text with normalization", () => {
    const evaluator: Evaluator = {
      strategy: "exact_text",
      answer: "I have lived here",
      normalization,
    };
    expect(
      evaluate(evaluator, { kind: "text", value: "  I have lived here.  " }).isCorrect,
    ).toBe(true);
    expect(
      evaluate(evaluator, { kind: "text", value: "I live here" }).isCorrect,
    ).toBe(false);
    const strict = {
      trim: false,
      collapseWhitespace: false,
      caseSensitive: true,
      ignoreTerminalPunctuation: false,
      normaliseApostrophes: false,
    };
    expect(evaluate({ strategy: "exact_text", answer: "Exact", normalization: strict }, { kind: "text", value: "Exact" }).isCorrect).toBe(true);
    expect(evaluate({ strategy: "exact_text", answer: "Exact", normalization: strict }, { kind: "text", value: " exact " }).isCorrect).toBe(false);
  });

  it("grades one_of_texts strategy", () => {
    const evaluator: Evaluator = {
      strategy: "one_of_texts",
      answers: ["went", "have gone"],
      normalization,
    };
    expect(evaluate(evaluator, { kind: "text", value: "WENT" }).isCorrect).toBe(true);
    expect(evaluate(evaluator, { kind: "text", value: "go" }).isCorrect).toBe(false);
  });

  describe("per_gap", () => {
    const evaluator: Evaluator = {
      strategy: "per_gap",
      gaps: [
        { gapId: "first", answers: ["went"] },
        { gapId: "second", answers: ["home", "house"] },
      ],
      normalization,
    };

    it("casa cada hueco por su gapId, no por posición", () => {
      expect(
        evaluate(evaluator, {
          kind: "gaps",
          value: [
            { gapId: "second", text: " HOUSE " },
            { gapId: "first", text: "WENT" },
          ],
        }).isCorrect,
      ).toBe(true);
    });

    it("corrige parcialmente en vez de todo o nada", () => {
      const result = evaluate(evaluator, {
        kind: "gaps",
        value: [
          { gapId: "first", text: "went" },
          { gapId: "second", text: "office" },
        ],
      });

      expect(result.isCorrect).toBe(false);
      expect(result.score).toBe(0.5);
      expect(result.items.map(({ itemId, isCorrect }) => [itemId, isCorrect])).toEqual([
        ["first", true],
        ["second", false],
      ]);
    });

    it("cuenta como fallo un hueco que no llega", () => {
      const result = evaluate(evaluator, {
        kind: "gaps",
        value: [{ gapId: "first", text: "went" }],
      });

      expect(result.score).toBe(0.5);
      expect(result.items[1]).toMatchObject({ itemId: "second", given: "", isCorrect: false });
    });

    it("cuenta como fallo un hueco en blanco", () => {
      const result = evaluate(evaluator, {
        kind: "gaps",
        value: [
          { gapId: "first", text: "   " },
          { gapId: "second", text: "house" },
        ],
      });

      expect(result.items[0]).toMatchObject({ itemId: "first", isCorrect: false });
    });

    it("admite texto plano cuando la actividad tiene un solo hueco", () => {
      expect(
        evaluate(
          { ...evaluator, gaps: [{ gapId: "only", answers: ["house"] }] },
          { kind: "text", value: " HOUSE " },
        ).isCorrect,
      ).toBe(true);
    });

    it("rechaza el texto plano si hay más de un hueco", () => {
      expect(evaluate(evaluator, { kind: "text", value: " HOUSE " }).isCorrect).toBe(false);
      expect(evaluate(evaluator, { kind: "multiple", value: ["house"] }).isCorrect).toBe(false);
    });
  });

  it("grades ordered_tokens strategy", () => {
    const evaluator: Evaluator = {
      strategy: "ordered_tokens",
      correctTokenIds: ["t1", "t2", "t3"],
    };
    expect(
      evaluate(evaluator, { kind: "ordered_list", value: ["t1", "t2", "t3"] }).isCorrect,
    ).toBe(true);
    expect(
      evaluate(evaluator, { kind: "ordered_list", value: ["t3", "t2", "t1"] }).isCorrect,
    ).toBe(false);
  });

  it("grades deck_booleans strategy", () => {
    const evaluator: Evaluator = {
      strategy: "deck_booleans",
      cards: [
        { cardId: "c1", correct: true },
        { cardId: "c2", correct: false },
      ],
    };
    expect(
      evaluate(evaluator, {
        kind: "deck",
        value: [
          { cardId: "c1", value: true },
          { cardId: "c2", value: false },
        ],
      }).isCorrect,
    ).toBe(true);
    expect(
      evaluate(evaluator, {
        kind: "deck",
        value: [
          { cardId: "c1", value: true },
          { cardId: "c2", value: true },
        ],
      }).score,
    ).toBe(0.5);
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
      }).isCorrect,
    ).toBe(true);
    expect(
      evaluate(evaluator, {
        kind: "pairs",
        value: [
          { leftId: "l1", rightId: "r2" },
          { leftId: "l2", rightId: "r1" },
        ],
      }).isCorrect,
    ).toBe(false);
    expect(
      evaluate(evaluator, {
        kind: "pairs",
        value: [
          { leftId: "l1", rightId: "r1" },
          { leftId: "l1", rightId: "r1" },
        ],
      }).isCorrect,
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
