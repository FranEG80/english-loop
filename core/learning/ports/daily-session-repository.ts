import type { DailySession } from "../domain/daily-session";

export interface DailySessionRepository {
  findById(sessionId: string): Promise<DailySession | null>;
  findByUserIdAndDate(
    userId: string,
    date: string,
  ): Promise<DailySession | null>;
  findByPracticeRunId(practiceRunId: string): Promise<DailySession | null>;
  save(session: DailySession): Promise<void>;
}
