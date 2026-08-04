import type { DailySessionRepository } from "@/core/learning/ports/daily-session-repository";
import type { LessonProgressRecord, LessonProgressRepository } from "@/core/learning/ports/lesson-progress-repository";
import type { D1TransportClient } from "./types/transport";
import { DailySession } from "@/core/learning/domain/daily-session";
import type { D1DailySessionSnapshot, D1LessonProgressSnapshot, D1Operation } from "./types/operations";
import { bool, iso, rows, text } from "./mappers/d1-row-mapper";
import { sessionRowsToDomain } from "./mappers/learning-mapper";
import { operation } from "./operations/request";

export class D1DailySessionRepository implements DailySessionRepository {
  constructor(private readonly transport: D1TransportClient) {}

  private async find(request: D1Operation): Promise<DailySession | null> {
    return sessionRowsToDomain(rows(await this.transport.execute(request)));
  }

  findById(sessionId: string): Promise<DailySession | null> {
    return this.find(operation({ name: "dailySessionGetById", sessionId }));
  }

  findByUserIdAndDate(userId: string, date: string): Promise<DailySession | null> {
    return this.find(operation({ name: "dailySessionGetByUserDate", userId, date }));
  }

  findByPracticeRunId(practiceRunId: string): Promise<DailySession | null> {
    return this.find(operation({ name: "dailySessionGetByPracticeRun", practiceRunId }));
  }

  async save(session: DailySession): Promise<void> {
    const snapshot = session.toSnapshot();
    const request: D1DailySessionSnapshot = {
      id: snapshot.id, userId: snapshot.userId, date: snapshot.date, status: snapshot.status,
      datasetVersion: snapshot.datasetVersion, seed: snapshot.seed, practiceRunId: snapshot.practiceRunId,
      createdAt: snapshot.createdAt,
      lessons: snapshot.lessons.map((lesson) => ({ ...lesson })),
    };
    await this.transport.execute(operation({ name: "dailySessionSave", snapshot: request }));
  }
}

export class D1LessonProgressRepository implements LessonProgressRepository {
  constructor(private readonly transport: D1TransportClient) {}

  async findByUserId(userId: string): Promise<LessonProgressRecord[]> {
    return rows(await this.transport.execute(operation({ name: "lessonProgressList", userId }))).map((row) => ({
      userId: text(row.userId), lessonId: text(row.lessonId), viewed: bool(row.viewed), viewedAt: row.viewedAt ? iso(row.viewedAt) : null, errorsPending: Number(row.errorsPending),
    }));
  }

  async upsert(record: LessonProgressRecord): Promise<void> {
    const snapshot: D1LessonProgressSnapshot = { ...record };
    await this.transport.execute(operation({ name: "lessonProgressSave", snapshot }));
  }
}
