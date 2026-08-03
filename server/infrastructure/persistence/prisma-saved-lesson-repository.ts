import "server-only";
import type { PrismaClient } from "@/generated/prisma/client";
import type { SavedLessonRepository } from "@/core/account/ports/saved-lesson-repository";
import { SavedLesson } from "@/core/account/domain/saved-lesson";
import { getPrismaClient } from "../database/prisma-transaction-context";

/**
 * Adaptador Prisma del repositorio de lecciones guardadas.
 */
export class PrismaSavedLessonRepository implements SavedLessonRepository {
  constructor(private readonly client: PrismaClient) {}

  async findByUserId(userId: string): Promise<SavedLesson[]> {
    const rows = await getPrismaClient(this.client).savedLesson.findMany({
      where: { userId },
      orderBy: { savedAt: "desc" },
    });
    return rows.map((row) =>
      SavedLesson.create({
        userId: row.userId,
        lessonId: row.lessonId,
        savedAt: row.savedAt.toISOString(),
      }),
    );
  }

  async findByUserAndLesson(
    userId: string,
    lessonId: string,
  ): Promise<SavedLesson | null> {
    const row = await getPrismaClient(this.client).savedLesson.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
    });
    if (!row) return null;
    return SavedLesson.create({
      userId: row.userId,
      lessonId: row.lessonId,
      savedAt: row.savedAt.toISOString(),
    });
  }

  async save(lesson: SavedLesson): Promise<void> {
    await getPrismaClient(this.client).savedLesson.upsert({
      where: {
        userId_lessonId: {
          userId: lesson.userId,
          lessonId: lesson.lessonId,
        },
      },
      create: {
        userId: lesson.userId,
        lessonId: lesson.lessonId,
        savedAt: new Date(lesson.savedAt),
      },
      update: {},
    });
  }

  async delete(userId: string, lessonId: string): Promise<void> {
    await getPrismaClient(this.client).savedLesson.deleteMany({
      where: { userId, lessonId },
    });
  }
}
