import type { DailySessionPort } from "@/core/ports";
import type {
  AttemptFeedbackDto,
  DailySessionDto,
  SubmitAttemptInputDto,
} from "@/core/models";
import { restRequest } from "./http-client";

export const dailySessionRestAdapter: DailySessionPort = {
  getTodaySession: (timezone) =>
    restRequest<DailySessionDto>(
      `/daily-sessions/current?timezone=${encodeURIComponent(timezone)}`,
    ),
  startDailyPractice: (sessionId) =>
    restRequest<DailySessionDto>(`/daily-sessions/${sessionId}/practice`, {
      method: "POST",
    }),
  submitDailyAttempt: (sessionId, input: SubmitAttemptInputDto) =>
    restRequest<AttemptFeedbackDto>(`/daily-sessions/${sessionId}/attempts`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  completeDailySession: (sessionId) =>
    restRequest<DailySessionDto>(`/daily-sessions/${sessionId}/complete`, {
      method: "POST",
    }),
};
