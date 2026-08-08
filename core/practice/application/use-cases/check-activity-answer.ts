import type { ActivityCatalogPort } from "@/core/content/ports/catalog-ports";
import type { ActivityResponseValue, AttemptFeedbackDto } from "@/core/models/types/attempt";
import { ResourceNotFoundException } from "@/core/shared/exceptions";
import { evaluate, normalizeResponse } from "../../domain/activity-evaluator";
import { describeEvaluationItems, extractCorrectAnswer } from "./attempt-feedback-view";

/**
 * Corrige una respuesta **sin registrar el intento**.
 *
 * Es lo que usa la previsualización del catálogo: entrar en una actividad y
 * comprobarla debe decir si está bien y por qué, pero no puede contar como
 * práctica ni mover el repaso espaciado, porque el alumno no la ha hecho
 * dentro de una sesión.
 */
export async function checkActivityAnswer(
  activityCatalog: ActivityCatalogPort,
  input: { activityId: string; response: ActivityResponseValue },
): Promise<AttemptFeedbackDto> {
  const activity = await activityCatalog.getActivityById(input.activityId);
  if (!activity) {
    throw new ResourceNotFoundException(
      `Activity not found: ${input.activityId}`,
      "The activity was not found.",
    );
  }

  const evaluation = evaluate(activity.evaluator, input.response);

  return {
    // No hay intento: el identificador deja claro que esto no se ha guardado.
    attemptId: "preview",
    activityId: activity.id,
    isCorrect: evaluation.isCorrect,
    score: evaluation.score,
    correctAnswer: extractCorrectAnswer(activity),
    normalizedResponse: normalizeResponse(activity.evaluator, input.response),
    items: describeEvaluationItems(evaluation.items, activity),
    explanation: activity.explanation,
    nextReviewAt: null,
    submittedAt: new Date(0).toISOString(),
  };
}
