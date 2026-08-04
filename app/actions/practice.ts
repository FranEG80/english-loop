"use server";

import { revalidatePath } from "next/cache";
import { compositionRoot } from "@/server/infrastructure/composition/composition-root";
import { createFocusedPracticeRun } from "@/core/practice/application/use-cases/create-focused-practice-run";
import { submitAttemptTransaction } from "@/core/progress/application/use-cases/submit-attempt-transaction";
import { getAttemptFeedback } from "@/core/practice/application/use-cases/get-attempt-feedback";
import { toPracticeRunDto } from "@/core/practice/application/mappers/practice-run-mapper";
import type { CefrLevelFilter } from "@/core/models/level";
import type { SessionSize } from "@/core/models/session-size";
import { CONTENT_SCHEMA_VERSION } from "@/core/content/domain/content-version";

export interface CreateRunInput {
  taxonomyNodeId: string;
  level: CefrLevelFilter;
  sessionSize: SessionSize;
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
    CONTENT_SCHEMA_VERSION,
    {
      runId: input.runId,
      activityId: input.activityId,
      idempotencyKey: input.idempotencyKey,
      response: input.response as never,
    },
    { dailySessionRepository: compositionRoot.dailySessionRepository },
  );
  return getAttemptFeedback(compositionRoot.getActivityCatalog(), attempt, compositionRoot.reviewRepository);
}
