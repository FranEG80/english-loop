import type { ActivityCatalogPort } from "@/core/content/ports/catalog-ports";
import type { Activity, Evaluator } from "@/core/content/domain/types/activity";
import type { ActivityAttempt } from "../../domain/activity-attempt";
import type { AttemptFeedbackDto, AttemptItemResultDto } from "@/core/models/types/attempt";
import type { ReviewRepository } from "@/core/progress/ports/review-repository";
import { evaluate, normalizeResponse, type EvaluationItem } from "../../domain/activity-evaluator";

/** Construye el feedback seguro para el cliente a partir de un intento. */
export async function getAttemptFeedback(
  activityCatalog: ActivityCatalogPort,
  attempt: ActivityAttempt,
  reviewRepository?: ReviewRepository,
): Promise<AttemptFeedbackDto> {
  const pinnedActivity = attempt.activityVersionId && activityCatalog.getActivityByVersionId
    ? await activityCatalog.getActivityByVersionId(attempt.activityVersionId)
    : null;
  const activity = pinnedActivity ?? await activityCatalog.getActivityById(attempt.activityId);
  const correctAnswer = activity ? extractCorrectAnswer(activity.evaluator) : [];
  const review = reviewRepository
    ? await reviewRepository.findByUserIdAndActivity(attempt.userId, attempt.activityId)
    : null;

  // El desglose guardado manda; si el intento es anterior a la migración se
  // recalcula sobre la actividad para no perder la lista de errores.
  const evaluation =
    attempt.detail.length > 0
      ? { score: attempt.score, items: attempt.detail }
      : activity
        ? evaluate(activity.evaluator, attempt.response)
        : { score: attempt.isCorrect ? 1 : 0, items: [] };

  return {
    attemptId: attempt.id,
    activityId: attempt.activityId,
    isCorrect: attempt.isCorrect,
    score: evaluation.score,
    correctAnswer,
    normalizedResponse: activity
      ? normalizeResponse(activity.evaluator, attempt.response)
      : attempt.response,
    items: activity ? describeItems(evaluation.items, activity) : describeItems(evaluation.items),
    explanation: activity?.explanation ?? "",
    nextReviewAt: review && !review.isResolved ? review.dueAt : null,
    submittedAt: attempt.submittedAt,
  };
}

/**
 * Traduce los ids internos de cada sub-ítem a algo legible: la etiqueta de la
 * opción, el enunciado de la carta o el número de hueco. Añade el `feedback`
 * del distractor elegido cuando el contenido lo aporta.
 */
function describeItems(
  items: readonly EvaluationItem[],
  activity?: Activity,
): AttemptItemResultDto[] {
  const optionLabels = new Map(
    [
      ...(activity?.options ?? []),
      ...(activity?.rounds ?? []).flatMap((round) => round.options),
    ].map((option) => [option.id, option] as const),
  );
  const cardLabels = new Map((activity?.cards ?? []).map((card) => [card.id, card.statement]));
  const roundLabels = new Map((activity?.rounds ?? []).map((round) => [round.id, round.prompt]));
  const leftLabels = new Map((activity?.pairs ?? []).map((pair) => [pair.leftId, pair.left]));
  const rightLabels = new Map((activity?.pairs ?? []).map((pair) => [pair.rightId, pair.right]));

  return items.map((item, index) => {
    const chosen = optionLabels.get(item.given);
    return {
      itemId: item.itemId,
      label:
        cardLabels.get(item.itemId) ??
        roundLabels.get(item.itemId) ??
        leftLabels.get(item.itemId) ??
        optionLabels.get(item.itemId)?.text ??
        (item.itemId.startsWith("gap") ? `${index + 1}` : item.itemId),
      given: chosen?.text ?? rightLabels.get(item.given) ?? item.given,
      expected: item.expected.map(
        (value) => optionLabels.get(value)?.text ?? rightLabels.get(value) ?? value,
      ),
      isCorrect: item.isCorrect,
      ...(chosen?.feedback ? { feedback: chosen.feedback } : {}),
    };
  });
}

function extractCorrectAnswer(evaluator: Evaluator): string | string[] {
  switch (evaluator.strategy) {
    case "boolean":
      return evaluator.correct ? "true" : "false";
    case "single_option":
      return evaluator.correctOptionId;
    case "multiple_options":
      return evaluator.correctOptionIds;
    case "exact_text":
      return evaluator.answer;
    case "one_of_texts":
      return evaluator.answers;
    case "ordered_tokens":
      return evaluator.correctTokenIds;
    case "per_gap":
      return evaluator.gaps.map(({ answers }) => answers[0] ?? "");
    case "matching_pairs":
      return evaluator.pairs.map(({ rightId }) => rightId);
    case "deck_booleans":
      return evaluator.cards.map(({ correct }) => String(correct));
    case "game_rounds":
      return evaluator.rounds.map(({ correctOptionId }) => correctOptionId);
    default:
      return [];
  }
}
