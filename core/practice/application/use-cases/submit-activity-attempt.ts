import type { IdentityPort } from "@/core/account/ports/identity-port";
import type { ActivityCatalogPort } from "@/core/content/ports/catalog-ports";
import type { ActivityResponseValue } from "@/core/models/types/attempt";
import {
  UniqueId,
  type ClockPort,
  type IdGeneratorPort,
} from "@/core/shared/kernel";
import type { AttemptRepository } from "../../ports/attempt-repository";
import type { PracticeRunRepository } from "../../ports/practice-run-repository";
import { ActivityAttempt } from "../../domain/activity-attempt";
import { evaluate } from "../../domain/activity-evaluator";
import { ResourceNotFoundException, ForbiddenException, IdempotencyConflictException } from "@/core/shared/exceptions";
import { resolvePracticeRunActivity } from "./resolve-practice-run-activity";

export interface SubmitAttemptInput {
  runId: string;
  activityId: string;
  idempotencyKey: string;
  response: ActivityResponseValue;
}

export interface SubmitAttemptResult {
  attempt: ActivityAttempt;
  /** true si el run se completó con este intento. */
  runCompleted: boolean;
}

/**
 * Corrige una respuesta, registra el intento inmutable y avanza el run.
 * La idempotency key garantiza que reenviar el mismo comando devuelve el
 * resultado existente.
 */
export async function submitActivityAttempt(
  identity: IdentityPort,
  attemptRepository: AttemptRepository,
  runRepository: PracticeRunRepository,
  activityCatalog: ActivityCatalogPort,
  idGenerator: IdGeneratorPort,
  clock: ClockPort,
  evaluatorVersion: string,
  input: SubmitAttemptInput,
): Promise<SubmitAttemptResult> {
  const actor = await identity.requireActor();

  // Idempotencia: si ya existe un intento con esta clave, devolverlo.
  const existing = await attemptRepository.findByUserIdAndIdempotencyKey(
    actor.userId,
    input.idempotencyKey,
  );
  if (existing) {
    if (existing.activityId !== input.activityId) {
      throw new IdempotencyConflictException(
        "Idempotency key reused with a different payload",
        "This request was already submitted with different content.",
      );
    }
    return { attempt: existing, runCompleted: false };
  }

  const run = await runRepository.findById(input.runId);
  if (!run) {
    throw new ResourceNotFoundException(
      `Practice run not found: ${input.runId}`,
      "The practice run was not found.",
    );
  }
  if (run.userId !== actor.userId) {
    throw new ForbiddenException(
      "Cannot access another user's practice run",
      "You do not have access to this practice run.",
    );
  }

  const activity = await resolvePracticeRunActivity(
    activityCatalog,
    run,
    input.activityId,
  );
  if (!activity) {
    throw new ResourceNotFoundException(
      `Activity not found: ${input.activityId}`,
      "The activity was not found.",
    );
  }

  const isCorrect = evaluate(activity.evaluator, input.response);

  const attempt = ActivityAttempt.create({
    id: UniqueId.create(idGenerator).toString(),
    userId: actor.userId,
    practiceRunId: run.id,
    activityId: input.activityId,
    activityVersionId: activity.versionId,
    practiceRunItemId: `${run.id}:${run.currentIndex}`,
    isRepetition: run.isCurrentActivityRepetition,
    origin: run.mode,
    idempotencyKey: input.idempotencyKey,
    response: input.response,
    isCorrect,
    evaluatorVersion,
    submittedAt: clock.nowIso(),
  });

  await attemptRepository.save(attempt);
  if (!attempt.isCorrect && !attempt.isRepetition) {
    run.scheduleRepetition(input.activityId, activity.versionId ?? run.currentActivityVersionId);
  }
  const runCompleted = run.advance();
  await runRepository.save(run);

  return { attempt, runCompleted };
}
