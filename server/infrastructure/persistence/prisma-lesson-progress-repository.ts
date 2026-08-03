import "server-only";
import type { PrismaClient } from "@/generated/prisma/client";
import type {
  LessonProgressRecord,
  LessonProgressRepository,
} from "@/core/learning/ports/lesson-progress-repository";
import { getPrismaClient } from "../database/prisma-transaction-context";

/**
 * Adaptador Prisma del repositorio de progreso de lecciones.
 */
export class PrismaLessonProgressRepository implements LessonProgressRepository {
  constructor(private readonly client: PrismaClient) {}

  async findByUserId(userId: string): Promise<LessonProgressRecord[]> {
    const rows = await getPrismaClient(this.client).userLessonProgress.findMany({
      where: { userId },
    });
    return rows.map((row) => ({
      userId: row.userId,
      lessonId: row.lessonId,
      viewed: row.viewed,
      viewedAt: row.viewedAt?.toISOString() ?? null,
      errorsPending: row.errorsPending,
    }));
  }

  async upsert(record: LessonProgressRecord): Promise<void> {
    await getPrismaClient(this.client).userLessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId: record.userId,
          lessonId: record.lessonId,
        },
      },
      create: {
        userId: record.userId,
        lessonId: record.lessonId,
        viewed: record.viewed,
        viewedAt: record.viewedAt ? new Date(record.viewedAt) : null,
        errorsPending: record.errorsPending,
      },
      update: {
        viewed: record.viewed,
        viewedAt: record.viewedAt ? new Date(record.viewedAt) : null,
        errorsPending: record.errorsPending,
      },
    });
  }
}
