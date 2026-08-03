import "server-only";
import type { PrismaClient } from "@/generated/prisma/client";
import type { DailySessionRepository } from "@/core/learning/ports/daily-session-repository";
import { DailySession } from "@/core/learning/domain/daily-session";
import { getPrismaClient } from "../database/prisma-transaction-context";

/**
 * Adaptador Prisma del repositorio de sesiones diarias.
 */
export class PrismaDailySessionRepository implements DailySessionRepository {
  constructor(private readonly client: PrismaClient) {}

  async findById(sessionId: string): Promise<DailySession | null> {
    const row = await getPrismaClient(this.client).dailySession.findUnique({
      where: { id: sessionId },
      include: { lessons: { orderBy: { order: "asc" } } },
    });
    if (!row) return null;
    return this.toDomain(row);
  }

  async findByUserIdAndDate(
    userId: string,
    date: string,
  ): Promise<DailySession | null> {
    const row = await getPrismaClient(this.client).dailySession.findUnique({
      where: { userId_date: { userId, date } },
      include: { lessons: { orderBy: { order: "asc" } } },
    });
    if (!row) return null;
    return this.toDomain(row);
  }

  async findByPracticeRunId(practiceRunId: string): Promise<DailySession | null> {
    const row = await getPrismaClient(this.client).dailySession.findUnique({
      where: { practiceRunId },
      include: { lessons: { orderBy: { order: "asc" } } },
    });
    return row ? this.toDomain(row) : null;
  }

  private toDomain(row: {
    id: string;
    userId: string;
    date: string;
    status: string;
    datasetVersion: string;
    seed: string;
    practiceRunId: string | null;
    createdAt: Date;
    lessons: Array<{
      lessonId: string;
      order: number;
      status: string;
      selectionReason: string;
      completedAt: Date | null;
    }>;
  }): DailySession {
    return DailySession.create({
      id: row.id,
      userId: row.userId,
      date: row.date,
      status: row.status as never,
      datasetVersion: row.datasetVersion,
      seed: row.seed,
      lessons: row.lessons.map((lesson) => ({
        lessonId: lesson.lessonId,
        order: lesson.order,
        status: lesson.status as never,
        selectionReason: lesson.selectionReason,
        completedAt: lesson.completedAt?.toISOString() ?? null,
      })),
      practiceRunId: row.practiceRunId,
      createdAt: row.createdAt.toISOString(),
    });
  }

  async save(session: DailySession): Promise<void> {
    const snapshot = session.toSnapshot();
    await getPrismaClient(this.client).dailySession.upsert({
      where: { id: snapshot.id },
      create: {
        id: snapshot.id,
        userId: snapshot.userId,
        date: snapshot.date,
        status: snapshot.status,
        datasetVersion: snapshot.datasetVersion,
        seed: snapshot.seed,
        practiceRunId: snapshot.practiceRunId,
        createdAt: new Date(snapshot.createdAt),
        lessons: {
          create: snapshot.lessons.map((lesson) => ({
            lessonId: lesson.lessonId,
            order: lesson.order,
            status: lesson.status,
            selectionReason: lesson.selectionReason,
            completedAt: lesson.completedAt
              ? new Date(lesson.completedAt)
              : null,
          })),
        },
      },
      update: {
        status: snapshot.status,
        practiceRunId: snapshot.practiceRunId,
        lessons: {
          deleteMany: {},
          create: snapshot.lessons.map((lesson) => ({
            lessonId: lesson.lessonId,
            order: lesson.order,
            status: lesson.status,
            selectionReason: lesson.selectionReason,
            completedAt: lesson.completedAt
              ? new Date(lesson.completedAt)
              : null,
          })),
        },
      },
    });
  }
}
