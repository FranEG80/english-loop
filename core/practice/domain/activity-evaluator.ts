import type { Evaluator, NormalizationRules } from "@/core/content/domain/types/activity";
import type { ActivityResponseValue } from "@/core/models/types/attempt";
import { UnsupportedEvaluatorException } from "@/core/shared/exceptions";

const CURLY_APOSTROPHES = /[‘’ʼ]/g;
const TERMINAL_PUNCTUATION = /[.!?]+$/u;
const DEFAULT_NORMALIZATION: NormalizationRules = {
  trim: true,
  collapseWhitespace: true,
  caseSensitive: false,
  ignoreTerminalPunctuation: true,
  normaliseApostrophes: true,
};

/** Resultado de un sub-ítem corregible: un hueco, una carta, una ronda, un par. */
export interface EvaluationItem {
  /** `gapId`, `cardId`, `roundId`, `leftId` o `"answer"` si no hay sub-ítems. */
  itemId: string;
  given: string;
  expected: string[];
  isCorrect: boolean;
}

export interface EvaluationResult {
  /** Todos los sub-ítems correctos. */
  isCorrect: boolean;
  /** Media de aciertos entre 0 y 1. */
  score: number;
  items: EvaluationItem[];
}

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
  const rules = normalizationOf(evaluator);
  switch (evaluator.strategy) {
    case "exact_text":
    case "one_of_texts":
      return response.kind === "text"
        ? { kind: "text", value: normalizeText(response.value, rules) }
        : response;
    case "per_gap":
      return response.kind === "gaps"
        ? {
            kind: "gaps",
            value: response.value.map(({ gapId, text }) => ({
              gapId,
              text: normalizeText(text, rules),
            })),
          }
        : response;
    default:
      return response;
  }
}

function normalizationOf(evaluator: Evaluator): NormalizationRules {
  return "normalization" in evaluator
    ? (evaluator.normalization ?? DEFAULT_NORMALIZATION)
    : DEFAULT_NORMALIZATION;
}

function equivalent(left: string, right: string, rules: NormalizationRules): boolean {
  return normalizeText(left, rules) === normalizeText(right, rules);
}

function sameStringSequence(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

/**
 * Evalúa una respuesta contra un evaluador determinista. Nunca usa IA ni
 * similitud semántica.
 *
 * Devuelve el desglose por sub-ítem, no un booleano: es lo que alimenta la
 * media de aciertos y la lista de errores del resumen de sesión. Las
 * actividades de una sola respuesta devuelven un único ítem con id `answer`.
 */
export function evaluate(
  evaluator: Evaluator,
  response: ActivityResponseValue,
): EvaluationResult {
  switch (evaluator.strategy) {
    case "boolean":
      return single(
        response.kind === "boolean" ? String(response.value) : "",
        [String(evaluator.correct)],
        response.kind === "boolean" && response.value === evaluator.correct,
      );

    case "single_option":
      return single(
        response.kind === "single" ? response.value : "",
        [evaluator.correctOptionId],
        response.kind === "single" && response.value === evaluator.correctOptionId,
      );

    case "multiple_options": {
      // Un ítem por opción correcta más uno por cada elección sobrante, para
      // poder señalar exactamente qué faltó y qué sobró.
      if (response.kind !== "multiple") return failed(evaluator.correctOptionIds);
      const chosen = new Set(response.value);
      const expected = new Set(evaluator.correctOptionIds);
      const items: EvaluationItem[] = evaluator.correctOptionIds.map((optionId) => ({
        itemId: optionId,
        given: chosen.has(optionId) ? optionId : "",
        expected: [optionId],
        isCorrect: chosen.has(optionId),
      }));
      for (const optionId of response.value) {
        if (expected.has(optionId)) continue;
        items.push({ itemId: optionId, given: optionId, expected: [], isCorrect: false });
      }
      return fromItems(items);
    }

    case "exact_text":
      return single(
        response.kind === "text" ? response.value : "",
        [evaluator.answer],
        response.kind === "text" &&
          equivalent(response.value, evaluator.answer, evaluator.normalization),
      );

    case "one_of_texts":
      return single(
        response.kind === "text" ? response.value : "",
        evaluator.answers,
        response.kind === "text" &&
          evaluator.answers.some((answer) =>
            equivalent(response.value, answer, evaluator.normalization),
          ),
      );

    case "per_gap": {
      // Corrección parcial y casada por `gapId`, no por posición: el orden en
      // que el cliente envía los huecos no puede cambiar la nota.
      const given = new Map(
        response.kind === "gaps"
          ? response.value.map(({ gapId, text }) => [gapId, text] as const)
          : response.kind === "text" && evaluator.gaps.length === 1
            ? [[evaluator.gaps[0]!.gapId, response.value] as const]
            : [],
      );

      return fromItems(
        evaluator.gaps.map(({ gapId, answers }) => {
          const value = given.get(gapId) ?? "";
          return {
            itemId: gapId,
            given: value,
            expected: answers,
            isCorrect:
              value.trim().length > 0 &&
              answers.some((answer) => equivalent(value, answer, evaluator.normalization)),
          };
        }),
      );
    }

    case "ordered_tokens":
      return single(
        response.kind === "ordered_list" ? response.value.join(" ") : "",
        [evaluator.correctTokenIds.join(" ")],
        response.kind === "ordered_list" &&
          sameStringSequence(response.value, evaluator.correctTokenIds),
      );

    case "matching_pairs": {
      if (response.kind !== "pairs") {
        return failed(evaluator.pairs.map(({ rightId }) => rightId));
      }
      const byLeft = new Map(response.value.map((pair) => [pair.leftId, pair.rightId]));
      const items = evaluator.pairs.map(({ leftId, rightId }) => ({
        itemId: leftId,
        given: byLeft.get(leftId) ?? "",
        expected: [rightId],
        isCorrect: byLeft.get(leftId) === rightId,
      }));
      return fromItems(items);
    }

    case "deck_booleans": {
      const given = new Map(
        response.kind === "deck"
          ? response.value.map(({ cardId, value }) => [cardId, value] as const)
          : [],
      );
      return fromItems(
        evaluator.cards.map(({ cardId, correct }) => {
          const value = given.get(cardId);
          return {
            itemId: cardId,
            given: value === undefined ? "" : String(value),
            expected: [String(correct)],
            isCorrect: value === correct,
          };
        }),
      );
    }

    case "game_rounds": {
      const given = new Map(
        response.kind === "rounds"
          ? response.value.map(({ roundId, optionId }) => [roundId, optionId] as const)
          : [],
      );
      return fromItems(
        evaluator.rounds.map(({ roundId, correctOptionId }) => {
          const value = given.get(roundId) ?? "";
          return {
            itemId: roundId,
            given: value,
            expected: [correctOptionId],
            isCorrect: value === correctOptionId,
          };
        }),
      );
    }

    default:
      throw new UnsupportedEvaluatorException(
        `Unsupported evaluator strategy`,
        "This activity cannot be graded.",
      );
  }
}

function single(given: string, expected: string[], isCorrect: boolean): EvaluationResult {
  return fromItems([{ itemId: "answer", given, expected, isCorrect }]);
}

/** Respuesta de tipo equivocado: todos los sub-ítems fallan. */
function failed(itemIds: string[]): EvaluationResult {
  return fromItems(
    itemIds.map((itemId) => ({ itemId, given: "", expected: [itemId], isCorrect: false })),
  );
}

function fromItems(items: EvaluationItem[]): EvaluationResult {
  if (items.length === 0) return { isCorrect: false, score: 0, items: [] };
  const correct = items.filter((item) => item.isCorrect).length;
  return { isCorrect: correct === items.length, score: correct / items.length, items };
}
