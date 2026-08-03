import type { ActivityCatalogPort } from "@/core/content/ports/catalog-ports";
import type { Evaluator } from "@/core/content/domain/activity";
import type { ActivityAttempt } from "../../domain/activity-attempt";
import type { AttemptFeedbackDto } from "@/core/models/attempt";

/** Construye el feedback seguro para el cliente a partir de un intento. */
export async function getAttemptFeedback(
  activityCatalog: ActivityCatalogPort,
  attempt: ActivityAttempt,
): Promise<AttemptFeedbackDto> {
  const activity = await activityCatalog.getActivityById(attempt.activityId);
  const correctAnswer = activity
    ? extractCorrectAnswer(activity.evaluator)
    : [];

  return {
    attemptId: attempt.id,
    activityId: attempt.activityId,
    isCorrect: attempt.isCorrect,
    correctAnswer,
    explanation: activity?.explanation ?? "",
    submittedAt: attempt.submittedAt,
  };
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
    case "unordered_set":
      return evaluator.correctValues;
    default:
      return [];
  }
}
