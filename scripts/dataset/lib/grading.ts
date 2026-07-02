import { normalizeText } from "./normalize";
import type {
  ActivityResponse,
  Evaluator,
  NormalizationRules,
} from "./types";

export function grade(evaluator: Evaluator, response: ActivityResponse): boolean {
  switch (evaluator.strategy) {
    case "boolean":
      return typeof response === "boolean" && response === evaluator.correct;

    case "single_option":
      return (
        typeof response === "string" &&
        response === evaluator.correctOptionId
      );

    case "multiple_options":
      return (
        Array.isArray(response) &&
        sameStringSet(response, evaluator.correctOptionIds)
      );

    case "exact_text":
      return (
        typeof response === "string" &&
        equivalent(response, evaluator.answer, evaluator.normalization)
      );

    case "one_of_texts":
      return (
        typeof response === "string" &&
        evaluator.answers.some((answer) =>
          equivalent(response, answer, evaluator.normalization),
        )
      );

    case "per_gap":
      return (
        isStringRecord(response) &&
        evaluator.gaps.every((gap) => {
          const supplied = response[gap.gapId];
          return (
            supplied !== undefined &&
            gap.answers.some((answer) =>
              equivalent(supplied, answer, evaluator.normalization),
            )
          );
        }) &&
        Object.keys(response).length === evaluator.gaps.length
      );

    case "ordered_tokens":
      return (
        Array.isArray(response) &&
        sameStringSequence(response, evaluator.correctTokenIds)
      );

    case "unordered_set":
      return (
        Array.isArray(response) &&
        sameNormalisedSet(
          response,
          evaluator.correctValues,
          evaluator.normalization,
        )
      );

    case "matching_pairs":
      return (
        isStringRecord(response) &&
        evaluator.pairs.every(
          ({ leftId, rightId }) => response[leftId] === rightId,
        ) &&
        Object.keys(response).length === evaluator.pairs.length
      );
  }
}

function equivalent(
  left: string,
  right: string,
  rules: NormalizationRules,
): boolean {
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

function isStringRecord(value: ActivityResponse): value is Record<string, string> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every((entry) => typeof entry === "string")
  );
}
