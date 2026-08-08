import type { IdentityPort } from "@/core/account/ports/identity-port";
import type { ActivityCatalogPort } from "@/core/content/ports/catalog-ports";
import type { AttemptRepository } from "../../ports/attempt-repository";
import type { PracticeRunRepository } from "../../ports/practice-run-repository";
import type { Activity } from "@/core/content/domain/types/activity";
import type { ActivityAttempt } from "../../domain/activity-attempt";
import type { PracticeRun } from "../../domain/practice-run";
import type { PracticeRunErrorDto } from "@/core/models/types/practice";
import { evaluate } from "../../domain/activity-evaluator";
import { describeEvaluationItems } from "./attempt-feedback-view";
import { getPracticeRun } from "./get-practice-run";

export interface PracticeRunSummary {
  run: PracticeRun;
  runId: string;
  correctCount: number;
  incorrectCount: number;
  recoveredCount: number;
  scorePercent: number;
  coveredSubtopicIds: string[];
  /** Todos los fallos de la sesión, con su desglose y su explicación. */
  errors: PracticeRunErrorDto[];
}

/** Obtiene el resultado real de los intentos registrados en un practice run. */
export async function getPracticeRunSummary(
  identity: IdentityPort,
  runRepository: PracticeRunRepository,
  attemptRepository: AttemptRepository,
  activityCatalog: ActivityCatalogPort,
  runId: string,
): Promise<PracticeRunSummary> {
  const run = await getPracticeRun(identity, runRepository, runId);
  const attempts = await attemptRepository.findByPracticeRunId(run.id);
  const coveredSubtopicIds = new Set<string>();
  const errors: PracticeRunErrorDto[] = [];

  // Se recorren en serie para que la lista de fallos salga en el orden en que
  // el alumno los cometió; en paralelo el orden dependería de la latencia.
  for (const attempt of attempts) {
    const pinnedActivity = attempt.activityVersionId && activityCatalog.getActivityByVersionId
      ? await activityCatalog.getActivityByVersionId(attempt.activityVersionId)
      : null;
    const activity = pinnedActivity ?? await activityCatalog.getActivityById(attempt.activityId);
    for (const taxonomyNodeId of activity?.taxonomyNodeIds ?? []) {
      coveredSubtopicIds.add(taxonomyNodeId);
    }

    if (attempt.isCorrect || attempt.isRepetition || !activity) continue;
    errors.push({
      activityId: attempt.activityId,
      prompt: activity.gapText ?? activity.prompt,
      explanation: activity.explanation,
      items: describeEvaluationItems(itemsOf(attempt, activity), activity),
    });
  }

  const originalAttempts = attempts.filter((attempt) => !attempt.isRepetition);
  const correctCount = originalAttempts.filter((attempt) => attempt.isCorrect).length;
  const incorrectCount = originalAttempts.filter((attempt) => !attempt.isCorrect).length;
  const recoveredCount = attempts.filter((attempt) => attempt.isRepetition && attempt.isCorrect).length;
  return {
    run,
    runId: run.id,
    correctCount,
    incorrectCount,
    recoveredCount,
    scorePercent: run.originalActivityCount === 0
      ? 0
      : Math.round((correctCount / run.originalActivityCount) * 100),
    coveredSubtopicIds: [...coveredSubtopicIds].sort(),
    errors,
  };
}

/**
 * Desglose de un intento. Manda el que se guardó; si el intento es anterior a
 * la corrección con detalle se recalcula, y un evaluador retirado no puede
 * tumbar el resumen entero.
 */
function itemsOf(
  attempt: ActivityAttempt,
  activity: Activity,
): ReturnType<typeof evaluate>["items"] {
  if (attempt.detail.length > 0) return attempt.detail;
  try {
    return evaluate(activity.evaluator, attempt.response).items;
  } catch {
    return [];
  }
}
