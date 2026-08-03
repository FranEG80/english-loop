import type { ActivityAttempt } from "../domain/activity-attempt";

export interface AttemptRepository {
  findByUserIdAndIdempotencyKey(
    userId: string,
    idempotencyKey: string,
  ): Promise<ActivityAttempt | null>;
  findByPracticeRunId(practiceRunId: string): Promise<ActivityAttempt[]>;
  findByUserIdAndActivityId(
    userId: string,
    activityId: string,
    limit?: number,
  ): Promise<ActivityAttempt[]>;
  save(attempt: ActivityAttempt): Promise<void>;
}
