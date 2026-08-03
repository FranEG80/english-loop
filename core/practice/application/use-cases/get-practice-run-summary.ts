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
      const activity = await activityCatalog.getActivityById(attempt.activityId);
      for (const taxonomyNodeId of activity?.taxonomyNodeIds ?? []) {
        coveredSubtopicIds.add(taxonomyNodeId);
      }
    }),
  );

  return {
    run,
    runId: run.id,
    correctCount: attempts.filter((attempt) => attempt.isCorrect).length,
    incorrectCount: attempts.filter((attempt) => !attempt.isCorrect).length,
    coveredSubtopicIds: [...coveredSubtopicIds].sort(),
  };
}
