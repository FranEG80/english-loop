import type { IdentityPort } from "@/core/account/ports/identity-port";
import type { ActivityCatalogPort, TaxonomyCatalogPort } from "@/core/content/ports/catalog-ports";
import { type ClockPort, type DomainEvent, type DomainEventDispatcherPort, type IdGeneratorPort, type UnitOfWorkPort, UniqueId } from "@/core/shared/kernel";
import type { ActivityResponseValue } from "@/core/models/attempt";
import type { AttemptRepository } from "@/core/practice/ports/attempt-repository";
import type { PracticeRunRepository } from "@/core/practice/ports/practice-run-repository";
import type { DailySessionRepository } from "@/core/learning/ports/daily-session-repository";
import { ActivityAttempt } from "@/core/practice/domain/activity-attempt";
import { ActivityAnswered, ActivityFailed } from "@/core/practice/domain/events";
import { evaluate } from "@/core/practice/domain/activity-evaluator";
import type { ProgressRepository } from "../../ports/progress-repository";
import type { ReviewRepository } from "../../ports/review-repository";
import { ProgressProjector } from "../projectors/progress-projector";
import {
  ConflictException,
  ForbiddenException,
  IdempotencyConflictException,
  ResourceNotFoundException,
} from "@/core/shared/exceptions";

export interface SubmitAttemptTransactionInput {
  runId: string;
  activityId: string;
  idempotencyKey: string;
  response: ActivityResponseValue;
}

export interface SubmitAttemptTransactionResult {
  attempt: ActivityAttempt;
  runCompleted: boolean;
  reviewUpdated: boolean;
}

export interface SubmitAttemptTransactionOptions {
  dailySessionRepository?: DailySessionRepository;
}

/** Persiste un intento y todas sus proyecciones en una única transacción. */
export async function submitAttemptTransaction(
  identity: IdentityPort,
  unitOfWork: UnitOfWorkPort,
  attemptRepository: AttemptRepository,
  runRepository: PracticeRunRepository,
  activityCatalog: ActivityCatalogPort,
  progressRepository: ProgressRepository,
  reviewRepository: ReviewRepository,
  taxonomyCatalog: TaxonomyCatalogPort,
  idGenerator: IdGeneratorPort,
  clock: ClockPort,
  domainEventDispatcher: DomainEventDispatcherPort,
  evaluatorVersion: string,
  input: SubmitAttemptTransactionInput,
  options: SubmitAttemptTransactionOptions = {},
): Promise<SubmitAttemptTransactionResult> {
  const actor = await identity.requireActor();
  const nowIso = clock.nowIso();
  const projector = new ProgressProjector(
    progressRepository,
    reviewRepository,
    taxonomyCatalog,
    idGenerator,
    clock,
  );

  const { created, events, ...result } = await unitOfWork.transaction(async () => {
    const existing = await attemptRepository.findByUserIdAndIdempotencyKey(
      actor.userId,
      input.idempotencyKey,
    );
    if (existing) {
      if (
        existing.activityId !== input.activityId ||
        JSON.stringify(existing.response) !== JSON.stringify(input.response)
      ) {
        throw new IdempotencyConflictException(
          "Idempotency key reused with a different payload",
          "This request was already submitted with different content.",
        );
      }
      return {
        attempt: existing,
        runCompleted: false,
        reviewUpdated: false,
        created: false,
        events: [],
      };
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
    if (run.status === "completed") {
      throw new ConflictException(
        "Cannot submit an attempt to a completed practice run",
        "This practice run is already completed.",
      );
    }
    if (run.currentActivityId !== input.activityId) {
      throw new ConflictException(
        "Activity is not the current activity of the practice run",
        "Submit the current activity of this practice run.",
      );
    }

    const activity = await activityCatalog.getActivityById(input.activityId);
    if (!activity) {
      throw new ResourceNotFoundException(
        `Activity not found: ${input.activityId}`,
        "The activity was not found.",
      );
    }

    const attempt = ActivityAttempt.create({
      id: UniqueId.create(idGenerator).toString(),
      userId: actor.userId,
      practiceRunId: run.id,
      activityId: input.activityId,
      origin: run.mode,
      idempotencyKey: input.idempotencyKey,
      response: input.response,
      isCorrect: evaluate(activity.evaluator, input.response),
      evaluatorVersion,
      submittedAt: nowIso,
    });
    await attemptRepository.save(attempt);

    const reviewUpdated = await projector.project({
      userId: actor.userId,
      activity,
      origin: run.mode,
      isCorrect: attempt.isCorrect,
      attemptedAt: nowIso,
    });

    const runCompleted = run.advance();
    await runRepository.save(run);

    const events: DomainEvent[] = [
      attempt.isCorrect
        ? new ActivityAnswered(run.id, nowIso, actor.userId, activity.id, true)
        : new ActivityFailed(run.id, nowIso, actor.userId, activity.id),
    ];
    if (
      runCompleted &&
      run.mode === "DAILY" &&
      run.dailySessionId &&
      options.dailySessionRepository
    ) {
      const session = await options.dailySessionRepository.findById(run.dailySessionId);
      if (!session || session.userId !== actor.userId) {
        throw new ResourceNotFoundException(
          `Daily session not found for run: ${run.id}`,
          "The daily session was not found.",
        );
      }
      session.complete(nowIso);
      await options.dailySessionRepository.save(session);
      events.push(...session.pullDomainEvents());
    }

    return { attempt, runCompleted, reviewUpdated, created: true, events };
  });

  if (created) await domainEventDispatcher.dispatch(events);
  return result;
}
