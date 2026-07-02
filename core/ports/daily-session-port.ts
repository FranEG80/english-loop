import type { DailySessionDto } from "../models/daily-session";
import type { SubmitAttemptInputDto, AttemptFeedbackDto } from "../models/attempt";

export interface DailySessionPort {
  getTodaySession(timezone: string): Promise<DailySessionDto>;
  submitDailyAttempt(
    sessionId: string,
    input: SubmitAttemptInputDto,
  ): Promise<AttemptFeedbackDto>;
  completeDailySession(sessionId: string): Promise<DailySessionDto>;
}
