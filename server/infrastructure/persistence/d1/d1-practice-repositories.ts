import type { AttemptRepository } from "@/core/practice/ports/attempt-repository";
import type { PracticeRunRepository } from "@/core/practice/ports/practice-run-repository";
import type { D1TransportClient } from "./types/transport";
import { ActivityAttempt } from "@/core/practice/domain/activity-attempt";
import { PracticeRun } from "@/core/practice/domain/practice-run";
import type { D1AttemptSnapshot, D1PracticeRunSnapshot } from "./types/operations";
import { first, rows, type Row } from "./mappers/d1-row-mapper";
import { attemptFromRow, practiceRunRowsToDomain } from "./mappers/practice-mapper";
import { operation } from "./operations/request";

export class D1PracticeRunRepository implements PracticeRunRepository {
  constructor(private readonly transport: D1TransportClient) {}

  async findById(runId: string): Promise<PracticeRun | null> {
    return practiceRunRowsToDomain(rows(await this.transport.execute(operation({ name: "practiceRunGet", runId }))));
  }

  async save(run: PracticeRun): Promise<void> {
    const snapshot = run.toSnapshot();
    const originalActivityCount = run.originalActivityCount;
    const request: D1PracticeRunSnapshot = {
      id: snapshot.id, userId: snapshot.userId, mode: snapshot.mode, status: snapshot.status,
      scopeSnapshot: JSON.stringify(snapshot.scope), currentIndex: snapshot.currentIndex,
      originalActivityCount, datasetVersion: snapshot.datasetVersion,
      createdAt: snapshot.createdAt,
      items: snapshot.activityIds.map((activityId, position) => ({
        position, lessonId: null, activityId, activityVersionId: snapshot.activityVersionIds?.[position] ?? null, origin: snapshot.mode,
        activitySnapshot: snapshot.activitySnapshots?.[position]
          ? JSON.stringify(snapshot.activitySnapshots[position])
          : null,
        status: position >= originalActivityCount ? "repetition" : position === snapshot.currentIndex ? "active" : position < snapshot.currentIndex ? "answered" : "pending",
        isRepetition: position >= originalActivityCount,
        repetitionOfItemId: position >= originalActivityCount ? `${snapshot.id}:${snapshot.activityIds.findIndex((id) => id === activityId)}` : null,
      })),
    };
    await this.transport.execute(operation({ name: "practiceRunSave", snapshot: request }));
  }
}

export class D1AttemptRepository implements AttemptRepository {
  constructor(private readonly transport: D1TransportClient) {}

  async findByUserIdAndIdempotencyKey(userId: string, idempotencyKey: string): Promise<ActivityAttempt | null> {
    const row = first<Row>(await this.transport.execute(operation({ name: "attemptGetByIdempotency", userId, idempotencyKey })));
    return row ? attemptFromRow(row) : null;
  }

  async findByPracticeRunId(practiceRunId: string): Promise<ActivityAttempt[]> {
    return rows(await this.transport.execute(operation({ name: "attemptsGetByRun", practiceRunId }))).map(attemptFromRow);
  }

  async findByUserIdAndActivityId(userId: string, activityId: string, limit = 50): Promise<ActivityAttempt[]> {
    return rows(await this.transport.execute(operation({ name: "attemptsGetByUserActivity", userId, activityId, limit }))).map(attemptFromRow);
  }

  async save(attempt: ActivityAttempt): Promise<void> {
    const snapshot: D1AttemptSnapshot = {
      id: attempt.id, userId: attempt.userId, practiceRunId: attempt.practiceRunId, activityId: attempt.activityId,
      activityVersionId: attempt.activityVersionId, practiceRunItemId: attempt.practiceRunItemId, origin: attempt.origin,
      idempotencyKey: attempt.idempotencyKey, response: JSON.stringify(attempt.response), isCorrect: attempt.isCorrect,
      isRepetition: attempt.isRepetition, evaluatorVersion: attempt.evaluatorVersion, submittedAt: attempt.submittedAt,
    };
    await this.transport.execute(operation({ name: "attemptSave", snapshot }));
  }
}
