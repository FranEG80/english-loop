import "server-only";
import type { PrismaClient } from "@/generated/prisma/client";
import type { AttemptRepository } from "@/core/practice/ports/attempt-repository";
import { ActivityAttempt } from "@/core/practice/domain/activity-attempt";
import { getPrismaClient } from "../database/prisma-transaction-context";

const DEFAULT_ATTEMPT_HISTORY_LIMIT = 50;

/**
 * Adaptador Prisma del repositorio de intentos. Los intentos son inmutables.
 */
export class PrismaAttemptRepository implements AttemptRepository {
  constructor(private readonly client: PrismaClient) {}

  async findByUserIdAndIdempotencyKey(
    userId: string,
    idempotencyKey: string,
  ): Promise<ActivityAttempt | null> {
    const row = await getPrismaClient(this.client).activityAttempt.findUnique({
      where: { userId_idempotencyKey: { userId, idempotencyKey } },
    });
    if (!row) return null;
    return ActivityAttempt.create({
      id: row.id,
      userId: row.userId,
      practiceRunId: row.practiceRunId,
      activityId: row.activityId,
      activityVersionId: row.activityVersionId,
      practiceRunItemId: row.practiceRunItemId,
      origin: row.origin as never,
      idempotencyKey: row.idempotencyKey,
      response: JSON.parse(row.response) as never,
      isCorrect: row.isCorrect,
      isRepetition: row.isRepetition,
      evaluatorVersion: row.evaluatorVersion,
      submittedAt: row.submittedAt.toISOString(),
    });
  }

  async findByPracticeRunId(practiceRunId: string): Promise<ActivityAttempt[]> {
    const rows = await getPrismaClient(this.client).activityAttempt.findMany({
      where: { practiceRunId },
      orderBy: { submittedAt: "asc" },
    });
    return rows.map((row) =>
      ActivityAttempt.create({
        id: row.id,
        userId: row.userId,
        practiceRunId: row.practiceRunId,
        activityId: row.activityId,
        activityVersionId: row.activityVersionId,
        practiceRunItemId: row.practiceRunItemId,
        origin: row.origin as never,
        idempotencyKey: row.idempotencyKey,
        response: JSON.parse(row.response) as never,
        isCorrect: row.isCorrect,
        isRepetition: row.isRepetition,
        evaluatorVersion: row.evaluatorVersion,
        submittedAt: row.submittedAt.toISOString(),
      }),
    );
  }

  async findByUserIdAndActivityId(
    userId: string,
    activityId: string,
    limit = DEFAULT_ATTEMPT_HISTORY_LIMIT,
  ): Promise<ActivityAttempt[]> {
    const rows = await getPrismaClient(this.client).activityAttempt.findMany({
      where: { userId, activityId },
      orderBy: { submittedAt: "desc" },
      take: limit,
    });
    return rows.map((row) =>
      ActivityAttempt.create({
        id: row.id,
        userId: row.userId,
        practiceRunId: row.practiceRunId,
        activityId: row.activityId,
        activityVersionId: row.activityVersionId,
        practiceRunItemId: row.practiceRunItemId,
        origin: row.origin as never,
        idempotencyKey: row.idempotencyKey,
        response: JSON.parse(row.response) as never,
        isCorrect: row.isCorrect,
        isRepetition: row.isRepetition,
        evaluatorVersion: row.evaluatorVersion,
        submittedAt: row.submittedAt.toISOString(),
      }),
    );
  }

  async save(attempt: ActivityAttempt): Promise<void> {
    await getPrismaClient(this.client).activityAttempt.create({
      data: {
        id: attempt.id,
        userId: attempt.userId,
        practiceRunId: attempt.practiceRunId,
        activityId: attempt.activityId,
        activityVersionId: attempt.activityVersionId,
        practiceRunItemId: attempt.practiceRunItemId,
        origin: attempt.origin,
        idempotencyKey: attempt.idempotencyKey,
        response: JSON.stringify(attempt.response),
        isCorrect: attempt.isCorrect,
        isRepetition: attempt.isRepetition,
        evaluatorVersion: attempt.evaluatorVersion,
        submittedAt: new Date(attempt.submittedAt),
      },
    });
  }
}
