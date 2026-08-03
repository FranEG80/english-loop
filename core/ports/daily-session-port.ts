import type { DailySessionDto } from "../models/types/daily-session";
import type { SubmitAttemptInputDto, AttemptFeedbackDto } from "../models/types/attempt";

export interface DailySessionPort {
  getTodaySession(timezone: string): Promise<DailySessionDto>;
  startDailyPractice(sessionId: string): Promise<DailySessionDto>;
  submitDailyAttempt(
    sessionId: string,
    input: SubmitAttemptInputDto,
  ): Promise<AttemptFeedbackDto>;
  completeDailySession(sessionId: string): Promise<DailySessionDto>;
}
