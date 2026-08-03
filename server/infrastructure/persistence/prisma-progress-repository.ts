import "server-only";
import type { PrismaClient } from "@/generated/prisma/client";
import type {
  ActivityProgressRecord,
  ProgressRepository,
  TaxonomyProgressRecord,
} from "@/core/progress/ports/progress-repository";
import { getPrismaClient } from "../database/prisma-transaction-context";

/**
 * Adaptador Prisma del repositorio de progreso.
 */
export class PrismaProgressRepository implements ProgressRepository {
  constructor(private readonly client: PrismaClient) {}

  async getActivityProgress(
    userId: string,
    activityId: string,
  ): Promise<ActivityProgressRecord | null> {
    const row = await getPrismaClient(this.client).userActivityProgress.findUnique({
      where: { userId_activityId: { userId, activityId } },
    });
    if (!row) return null;
    return {
      userId: row.userId,
      activityId: row.activityId,
      attemptsCount: row.attemptsCount,
      correctCount: row.correctCount,
      lastResult: row.lastResult,
      lastAttemptAt: row.lastAttemptAt?.toISOString() ?? null,
    };
  }

  async upsertActivityProgress(record: ActivityProgressRecord): Promise<void> {
    await getPrismaClient(this.client).userActivityProgress.upsert({
      where: {
        userId_activityId: {
          userId: record.userId,
          activityId: record.activityId,
        },
      },
      create: {
        userId: record.userId,
        activityId: record.activityId,
        attemptsCount: record.attemptsCount,
        correctCount: record.correctCount,
        lastResult: record.lastResult,
        lastAttemptAt: record.lastAttemptAt
          ? new Date(record.lastAttemptAt)
          : null,
      },
      update: {
        attemptsCount: record.attemptsCount,
        correctCount: record.correctCount,
        lastResult: record.lastResult,
        lastAttemptAt: record.lastAttemptAt
          ? new Date(record.lastAttemptAt)
          : null,
      },
    });
  }

  async getTaxonomyProgress(
    userId: string,
    taxonomyNodeId: string,
  ): Promise<TaxonomyProgressRecord | null> {
    const row = await getPrismaClient(this.client).taxonomyProgress.findUnique({
      where: { userId_taxonomyNodeId: { userId, taxonomyNodeId } },
    });
    if (!row) return null;
    return {
      userId: row.userId,
      taxonomyNodeId: row.taxonomyNodeId,
      attemptsCount: row.attemptsCount,
      correctCount: row.correctCount,
    };
  }

  async upsertTaxonomyProgress(record: TaxonomyProgressRecord): Promise<void> {
    await getPrismaClient(this.client).taxonomyProgress.upsert({
      where: {
        userId_taxonomyNodeId: {
          userId: record.userId,
          taxonomyNodeId: record.taxonomyNodeId,
        },
      },
      create: {
        userId: record.userId,
        taxonomyNodeId: record.taxonomyNodeId,
        attemptsCount: record.attemptsCount,
        correctCount: record.correctCount,
      },
      update: {
        attemptsCount: record.attemptsCount,
        correctCount: record.correctCount,
      },
    });
  }

  async getOverview(userId: string): Promise<{
    totalActivitiesCompleted: number;
    totalCorrect: number;
    totalAttempts: number;
    strongTopicIds: string[];
    weakTopicIds: string[];
  }> {
    const [activityRows, taxonomyRows] = await Promise.all([
      getPrismaClient(this.client).userActivityProgress.findMany({ where: { userId } }),
      getPrismaClient(this.client).taxonomyProgress.findMany({ where: { userId } }),
    ]);

    const totalActivitiesCompleted = activityRows.length;
    const totalCorrect = activityRows.reduce(
      (sum, row) => sum + row.correctCount,
      0,
    );
    const totalAttempts = activityRows.reduce(
      (sum, row) => sum + row.attemptsCount,
      0,
    );

    const strongTopicIds: string[] = [];
    const weakTopicIds: string[] = [];
    for (const row of taxonomyRows) {
      if (row.attemptsCount === 0) continue;
      const accuracy = row.correctCount / row.attemptsCount;
      if (accuracy >= 0.8) strongTopicIds.push(row.taxonomyNodeId);
      else if (accuracy < 0.5) weakTopicIds.push(row.taxonomyNodeId);
    }

    return {
      totalActivitiesCompleted,
      totalCorrect,
      totalAttempts,
      strongTopicIds,
      weakTopicIds,
    };
  }
}
