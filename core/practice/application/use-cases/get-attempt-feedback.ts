import type { ActivityCatalogPort } from "@/core/content/ports/catalog-ports";
import type { Activity } from "@/core/content/domain/types/activity";
import type { ActivityAttempt } from "../../domain/activity-attempt";
import type { AttemptFeedbackDto } from "@/core/models/types/attempt";
import type { ReviewRepository } from "@/core/progress/ports/review-repository";
import { evaluate, normalizeResponse, type EvaluationItem } from "../../domain/activity-evaluator";
import { describeEvaluationItems, extractCorrectAnswer } from "./attempt-feedback-view";

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
  const correctAnswer = activity ? extractCorrectAnswer(activity) : [];
  const review = reviewRepository
    ? await reviewRepository.findByUserIdAndActivity(attempt.userId, attempt.activityId)
    : null;

  const evaluation = resolveEvaluation(attempt, activity);

  return {
    attemptId: attempt.id,
    activityId: attempt.activityId,
    isCorrect: attempt.isCorrect,
    score: evaluation.score,
    correctAnswer,
    normalizedResponse: activity
      ? normalizeResponse(activity.evaluator, attempt.response)
      : attempt.response,
    items: activity ? describeEvaluationItems(evaluation.items, activity) : describeEvaluationItems(evaluation.items),
    explanation: activity?.explanation ?? "",
    nextReviewAt: review && !review.isResolved ? review.dueAt : null,
    submittedAt: attempt.submittedAt,
  };
}

/**
 * El desglose guardado manda. Si el intento es anterior a la migración se
 * recalcula sobre la actividad para no perder la lista de errores, pero un
 * evaluador retirado no puede tumbar la pantalla de feedback: en ese caso se
 * degrada al booleano que sí está persistido.
 */
function resolveEvaluation(
  attempt: ActivityAttempt,
  activity: Activity | null,
): { score: number; items: EvaluationItem[] } {
  if (attempt.detail.length > 0) return { score: attempt.score, items: attempt.detail };
  if (!activity) return { score: attempt.isCorrect ? 1 : 0, items: [] };

  try {
    return evaluate(activity.evaluator, attempt.response);
  } catch {
    return { score: attempt.isCorrect ? 1 : 0, items: [] };
  }
}

