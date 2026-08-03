import "server-only";
import type { PrismaClient } from "@/generated/prisma/client";
import type { ReviewRepository } from "@/core/progress/ports/review-repository";
import { ReviewItem } from "@/core/progress/domain/review-item";
import { getPrismaClient } from "../database/prisma-transaction-context";

const UPCOMING_REVIEW_LIMIT = 20;

/**
 * Adaptador Prisma del repositorio de repasos.
 */
export class PrismaReviewRepository implements ReviewRepository {
  constructor(private readonly client: PrismaClient) {}

  private toDomain(row: {
    id: string;
    userId: string;
    activityId: string;
    activityVersionId: string | null;
    lessonId: string | null;
    taxonomyNodeId: string;
    level: string;
    stage: number;
    consecutiveCorrect: number;
    dueAt: Date;
    failedAt: Date;
    resolvedAt: Date | null;
    attemptsCount: number;
  }): ReviewItem {
    return ReviewItem.create({
      id: row.id,
      userId: row.userId,
      activityId: row.activityId,
      activityVersionId: row.activityVersionId,
      lessonId: row.lessonId,
      taxonomyNodeId: row.taxonomyNodeId,
      level: row.level as never,
      stage: row.stage as never,
      consecutiveCorrect: row.consecutiveCorrect,
      dueAt: row.dueAt.toISOString(),
      failedAt: row.failedAt.toISOString(),
      resolvedAt: row.resolvedAt?.toISOString() ?? null,
      attemptsCount: row.attemptsCount,
    });
  }

  async findByUserIdAndActivity(
    userId: string,
    activityId: string,
  ): Promise<ReviewItem | null> {
    const row = await getPrismaClient(this.client).reviewItem.findFirst({
      where: { userId, activityId, resolvedAt: null },
      orderBy: { createdAt: "desc" },
    });
    return row ? this.toDomain(row) : null;
  }

  async findDueByUserId(userId: string, nowIso: string): Promise<ReviewItem[]> {
    const rows = await getPrismaClient(this.client).reviewItem.findMany({
      where: { userId, resolvedAt: null, dueAt: { lte: new Date(nowIso) } },
      orderBy: { dueAt: "asc" },
    });
    return rows.map((row) => this.toDomain(row));
  }

  async findUpcomingByUserId(
    userId: string,
    nowIso: string,
  ): Promise<ReviewItem[]> {
    const rows = await getPrismaClient(this.client).reviewItem.findMany({
      where: { userId, resolvedAt: null, dueAt: { gt: new Date(nowIso) } },
      orderBy: { dueAt: "asc" },
      take: UPCOMING_REVIEW_LIMIT,
    });
    return rows.map((row) => this.toDomain(row));
  }

  async save(item: ReviewItem): Promise<void> {
    const snapshot = item.toSnapshot();
    await getPrismaClient(this.client).reviewItem.upsert({
      where: { id: snapshot.id },
      create: {
        id: snapshot.id,
        userId: snapshot.userId,
        activityId: snapshot.activityId,
        activityVersionId: snapshot.activityVersionId ?? null,
        lessonId: snapshot.lessonId ?? null,
        taxonomyNodeId: snapshot.taxonomyNodeId,
        level: snapshot.level,
        stage: snapshot.stage,
        consecutiveCorrect: snapshot.consecutiveCorrect,
        dueAt: new Date(snapshot.dueAt),
        failedAt: new Date(snapshot.failedAt),
        resolvedAt: snapshot.resolvedAt ? new Date(snapshot.resolvedAt) : null,
        attemptsCount: snapshot.attemptsCount,
      },
      update: {
        stage: snapshot.stage,
        consecutiveCorrect: snapshot.consecutiveCorrect,
        dueAt: new Date(snapshot.dueAt),
        resolvedAt: snapshot.resolvedAt ? new Date(snapshot.resolvedAt) : null,
        attemptsCount: snapshot.attemptsCount,
      },
    });
  }
}
