import "server-only";
import type { PrismaClient } from "@/generated/prisma/client";
import type { AttemptRepository } from "@/core/practice/ports/attempt-repository";
import { ActivityAttempt } from "@/core/practice/domain/activity-attempt";
import { getPrismaClient } from "../database/prisma-transaction-context";

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
      origin: row.origin as never,
      idempotencyKey: row.idempotencyKey,
      response: JSON.parse(row.response) as never,
      isCorrect: row.isCorrect,
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
        origin: row.origin as never,
        idempotencyKey: row.idempotencyKey,
        response: JSON.parse(row.response) as never,
        isCorrect: row.isCorrect,
        evaluatorVersion: row.evaluatorVersion,
        submittedAt: row.submittedAt.toISOString(),
      }),
    );
  }

  async findByUserIdAndActivityId(
    userId: string,
    activityId: string,
    limit = 50,
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
        origin: row.origin as never,
        idempotencyKey: row.idempotencyKey,
        response: JSON.parse(row.response) as never,
        isCorrect: row.isCorrect,
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
        origin: attempt.origin,
        idempotencyKey: attempt.idempotencyKey,
        response: JSON.stringify(attempt.response),
        isCorrect: attempt.isCorrect,
        evaluatorVersion: attempt.evaluatorVersion,
        submittedAt: new Date(attempt.submittedAt),
      },
    });
  }
}
