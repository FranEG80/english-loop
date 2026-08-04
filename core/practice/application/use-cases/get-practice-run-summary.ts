import type { IdentityPort } from "@/core/account/ports/identity-port";
import type { ActivityCatalogPort } from "@/core/content/ports/catalog-ports";
import type { AttemptRepository } from "../../ports/attempt-repository";
import type { PracticeRunRepository } from "../../ports/practice-run-repository";
import type { PracticeRun } from "../../domain/practice-run";
import { getPracticeRun } from "./get-practice-run";

export interface PracticeRunSummary {
  run: PracticeRun;
  runId: string;
  correctCount: number;
  incorrectCount: number;
  recoveredCount: number;
  scorePercent: number;
  coveredSubtopicIds: string[];
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

  await Promise.all(
    attempts.map(async (attempt) => {
      const activity = attempt.activityVersionId && activityCatalog.getActivityByVersionId
        ? await activityCatalog.getActivityByVersionId(attempt.activityVersionId)
        : await activityCatalog.getActivityById(attempt.activityId);
      for (const taxonomyNodeId of activity?.taxonomyNodeIds ?? []) {
        coveredSubtopicIds.add(taxonomyNodeId);
      }
    }),
  );

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
  };
}
