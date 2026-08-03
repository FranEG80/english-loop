"use server";

import { revalidatePath } from "next/cache";
import { compositionRoot } from "@/server/infrastructure/composition/composition-root";
import { createFocusedPracticeRun } from "@/core/practice/application/use-cases/create-focused-practice-run";
import { submitAttemptTransaction } from "@/core/progress/application/use-cases/submit-attempt-transaction";
import { getAttemptFeedback } from "@/core/practice/application/use-cases/get-attempt-feedback";
import { toPracticeRunDto } from "@/core/practice/application/mappers/practice-run-mapper";
import type { CefrLevelFilter } from "@/core/models/level";

export interface CreateRunInput {
  taxonomyNodeId: string;
  level: CefrLevelFilter;
  sessionSize: 5 | 10 | 15 | 20;
}

/** Server Action para crear un run de práctica dirigida. */
export async function createPracticeRunAction(input: CreateRunInput) {
  const datasetVersion = await compositionRoot.getDatasetVersion();
  const { run } = await createFocusedPracticeRun(
    compositionRoot.identity,
    compositionRoot.practiceRunRepository,
    compositionRoot.getActivityCatalog(),
    compositionRoot.getTaxonomyCatalog(),
    compositionRoot.practiceRunPlanner,
    compositionRoot.idGenerator,
    compositionRoot.clock,
    datasetVersion,
    input,
  );
  revalidatePath("/review/focus");
  return toPracticeRunDto(run);
}

export interface SubmitAttemptInput {
  runId: string;
  activityId: string;
  idempotencyKey: string;
  response: unknown;
}

/** Server Action para enviar un intento. */
export async function submitAttemptAction(input: SubmitAttemptInput) {
  const { attempt } = await submitAttemptTransaction(
    compositionRoot.identity,
    compositionRoot.unitOfWork,
    compositionRoot.attemptRepository,
    compositionRoot.practiceRunRepository,
    compositionRoot.getActivityCatalog(),
    compositionRoot.progressRepository,
    compositionRoot.reviewRepository,
    compositionRoot.getTaxonomyCatalog(),
    compositionRoot.idGenerator,
    compositionRoot.clock,
    compositionRoot.domainEventDispatcher,
    "1.0.0",
    {
      runId: input.runId,
      activityId: input.activityId,
      idempotencyKey: input.idempotencyKey,
      response: input.response as never,
    },
    { dailySessionRepository: compositionRoot.dailySessionRepository },
  );
  return getAttemptFeedback(compositionRoot.getActivityCatalog(), attempt);
}
