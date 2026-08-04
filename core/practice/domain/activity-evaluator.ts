import type { Evaluator, NormalizationRules } from "@/core/content/domain/types/activity";
import type { ActivityResponseValue } from "@/core/models/types/attempt";
import { UnsupportedEvaluatorException } from "@/core/shared/exceptions";

const CURLY_APOSTROPHES = /[\u2018\u2019\u02bc]/g;
const TERMINAL_PUNCTUATION = /[.!?]+$/u;
const DEFAULT_NORMALIZATION: NormalizationRules = {
  trim: true,
  collapseWhitespace: true,
  caseSensitive: false,
  ignoreTerminalPunctuation: true,
  normaliseApostrophes: true,
};

function normalizeText(value: string, rules: NormalizationRules): string {
  let result = value.normalize("NFC");
  if (rules.normaliseApostrophes) result = result.replace(CURLY_APOSTROPHES, "'");
  if (rules.trim) result = result.trim();
  if (rules.collapseWhitespace) result = result.replace(/\s+/gu, " ");
  if (rules.ignoreTerminalPunctuation) result = result.replace(TERMINAL_PUNCTUATION, "");
  if (!rules.caseSensitive) result = result.toLocaleLowerCase("en-GB");
  return result;
}

/** Devuelve la respuesta en la forma que usa el evaluador para compararla. */
export function normalizeResponse(
  evaluator: Evaluator,
  response: ActivityResponseValue,
): ActivityResponseValue {
  switch (evaluator.strategy) {
    case "exact_text":
    case "one_of_texts":
    case "per_gap":
      return response.kind === "text"
        ? { kind: "text", value: normalizeText(response.value, evaluator.normalization ?? DEFAULT_NORMALIZATION) }
        : response;
    case "unordered_set":
      return response.kind === "multiple"
        ? { kind: "multiple", value: response.value.map((value) => normalizeText(value, evaluator.normalization ?? DEFAULT_NORMALIZATION)) }
        : response;
    default:
      return response;
  }
}

function equivalent(left: string, right: string, rules: NormalizationRules): boolean {
  return normalizeText(left, rules) === normalizeText(right, rules);
}

function sameStringSequence(left: string[], right: string[]): boolean {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

function sameStringSet(left: string[], right: string[]): boolean {
  return (
    new Set(left).size === left.length &&
    new Set(right).size === right.length &&
    left.length === right.length &&
    left.every((value) => right.includes(value))
  );
}

function sameNormalisedSet(
  left: string[],
  right: string[],
  rules: NormalizationRules,
): boolean {
  return sameStringSet(
    left.map((value) => normalizeText(value, rules)),
    right.map((value) => normalizeText(value, rules)),
  );
}

/**
 * Evalúa una respuesta contra un evaluador determinista. Nunca usa IA ni
 * similitud semántica.
 */
export function evaluate(
  evaluator: Evaluator,
  response: ActivityResponseValue,
): boolean {
  switch (evaluator.strategy) {
    case "boolean":
      return response.kind === "boolean" && response.value === evaluator.correct;

    case "single_option":
      return response.kind === "single" && response.value === evaluator.correctOptionId;

    case "multiple_options":
      return (
        response.kind === "multiple" &&
        sameStringSet(response.value, evaluator.correctOptionIds)
      );

    case "exact_text":
      return (
        response.kind === "text" &&
        equivalent(response.value, evaluator.answer, evaluator.normalization)
      );

    case "one_of_texts":
      return (
        response.kind === "text" &&
        evaluator.answers.some((answer) =>
          equivalent(response.value, answer, evaluator.normalization),
        )
      );

    case "per_gap": {
      if (response.kind !== "text") return false;
      // La respuesta per_gap llega como texto plano; se compara contra cada gap.
      return evaluator.gaps.some((gap) =>
        gap.answers.some((answer) =>
          equivalent(response.value, answer, evaluator.normalization),
        ),
      );
    }

    case "ordered_tokens":
      return (
        response.kind === "ordered_list" &&
        sameStringSequence(response.value, evaluator.correctTokenIds)
      );

    case "unordered_set":
      return (
        response.kind === "multiple" &&
        sameNormalisedSet(response.value, evaluator.correctValues, evaluator.normalization)
      );

    case "matching_pairs": {
      if (response.kind !== "pairs") return false;
      const byLeft = new Map(response.value.map((p) => [p.leftId, p.rightId]));
      return (
        evaluator.pairs.every(({ leftId, rightId }) => byLeft.get(leftId) === rightId) &&
        byLeft.size === evaluator.pairs.length
      );
    }

    default:
      throw new UnsupportedEvaluatorException(
        `Unsupported evaluator strategy`,
        "This activity cannot be graded.",
      );
  }
}
