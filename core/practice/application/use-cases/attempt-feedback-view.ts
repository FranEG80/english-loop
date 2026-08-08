import type {
  Activity,
  ActivityOption,
  ActivityPair,
  Evaluator,
} from "@/core/content/domain/types/activity";
import type { AttemptItemResultDto } from "@/core/models/types/attempt";
import type { EvaluationItem } from "../../domain/activity-evaluator";

/**
 * Presentación del resultado de una corrección. Lo comparten el feedback de un
 * intento guardado y la comprobación de la previsualización, que producen la
 * misma vista a partir del mismo desglose.
 */

/**
 * Traduce los ids internos de cada sub-ítem a algo legible: la etiqueta de la
 * opción, el enunciado de la carta o el número de hueco. Añade el `feedback`
 * del distractor elegido cuando el contenido lo aporta.
 */
export function describeEvaluationItems(
  items: readonly EvaluationItem[],
  activity?: Activity,
): AttemptItemResultDto[] {
  const optionLabels = new Map(
    (activity?.options ?? []).map((option) => [option.id, option] as const),
  );
  /**
   * Las opciones de un minijuego se numeran **dentro de cada ronda**, así que
   * las ocho rondas repiten los ids `a`, `b`, `c`. Con un único mapa la última
   * ronda pisaba a las demás y el resumen daba la misma respuesta correcta ocho
   * veces: hay que resolver cada id contra su propia ronda.
   */
  const roundOptions = new Map(
    (activity?.rounds ?? []).map(
      (round) =>
        [round.id, new Map(round.options.map((option) => [option.id, option] as const))] as const,
    ),
  );
  const cardLabels = new Map((activity?.cards ?? []).map((card) => [card.id, card.statement]));
  const roundLabels = new Map((activity?.rounds ?? []).map((round) => [round.id, round.prompt]));
  const leftLabels = new Map((activity?.pairs ?? []).map((pair) => [pair.leftId, pair.left]));
  const rightLabels = new Map((activity?.pairs ?? []).map((pair) => [pair.rightId, pair.right]));
  const tokenLabels = new Map((activity?.tokens ?? []).map((token) => [token.id, token.text]));

  // `word_order` guarda la respuesta como ids de token unidos por espacios; sin
  // deshacer esa lista el alumno leería «t4 t3 t2 t1» en vez de su frase.
  const isTokenOrder = activity?.evaluator.strategy === "ordered_tokens";
  const readable = (value: string) =>
    isTokenOrder
      ? value
          .split(" ")
          .map((id) => tokenLabels.get(id) ?? id)
          .join(" ")
      : value;

  return items.map((item, index) => {
    // Una elección sobrante de opción múltiple llega como `b#0`: el sufijo la
    // distingue de las demás, pero no es algo que se pueda enseñar.
    const optionId = item.itemId.replace(/#\d+$/, "");
    // En un minijuego el sub-ítem es la ronda: sus opciones mandan sobre las de
    // la actividad.
    const scoped = roundOptions.get(item.itemId) ?? optionLabels;
    const chosen = scoped.get(item.given);
    return {
      itemId: item.itemId,
      label:
        cardLabels.get(item.itemId) ??
        roundLabels.get(item.itemId) ??
        leftLabels.get(item.itemId) ??
        optionLabels.get(optionId)?.text ??
        (item.itemId.startsWith("gap") ? `${index + 1}` : item.itemId),
      given: chosen?.text ?? rightLabels.get(item.given) ?? readable(item.given),
      expected: item.expected.map(
        (value) => scoped.get(value)?.text ?? rightLabels.get(value) ?? readable(value),
      ),
      isCorrect: item.isCorrect,
      ...(chosen?.feedback ? { feedback: chosen.feedback } : {}),
    };
  });
}

/**
 * Respuesta correcta **en el idioma del alumno**, no en ids internos.
 *
 * Los evaluadores de opción, token, par y ronda guardan identificadores
 * (`a`, `t3`, `r1-o2`). Devolverlos tal cual producía «Respuesta correcta: a»,
 * que no dice nada: hay que resolverlos contra el contenido de la actividad.
 *
 * Los tipos con sub-ítems (mazo, minijuego) devuelven lista vacía a propósito:
 * su respuesta correcta no cabe en una línea y se explica ronda a ronda en
 * `items`.
 */
export function extractCorrectAnswer(activity: {
  evaluator: Evaluator;
  options?: readonly ActivityOption[];
  tokens?: readonly ActivityOption[];
  pairs?: readonly ActivityPair[];
  rounds?: readonly { options: readonly ActivityOption[] }[];
}): string | string[] {
  const { evaluator } = activity;
  const textOf = (source: readonly ActivityOption[] | undefined, id: string) =>
    source?.find((option) => option.id === id)?.text ?? id;

  switch (evaluator.strategy) {
    case "boolean":
      return evaluator.correct ? "true" : "false";
    case "single_option":
      return textOf(activity.options, evaluator.correctOptionId);
    case "multiple_options":
      return evaluator.correctOptionIds.map((id) => textOf(activity.options, id));
    case "exact_text":
      return evaluator.answer;
    case "one_of_texts":
      return evaluator.answers;
    case "ordered_tokens":
      // La frase reconstruida se lee; la lista de ids no.
      return evaluator.correctTokenIds.map((id) => textOf(activity.tokens, id)).join(" ");
    case "per_gap":
      return evaluator.gaps.map(({ answers }) => answers[0] ?? "");
    case "matching_pairs":
      return evaluator.pairs.map(({ leftId, rightId }) => {
        const pair = activity.pairs?.find((candidate) => candidate.leftId === leftId);
        return `${pair?.left ?? leftId} · ${pair?.right ?? rightId}`;
      });
    case "deck_booleans":
    case "game_rounds":
      return [];
    default:
      return [];
  }
}
