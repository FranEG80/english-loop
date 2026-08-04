import type { DailySessionPort } from "@/core/ports";
import type {
  AttemptFeedbackDto,
  DailySessionDto,
  SubmitAttemptInputDto,
} from "@/core/models";
import { restRequest } from "./http-client";

export const dailySessionRestAdapter: DailySessionPort = {
  getTodaySession: async (timezone) => {
    const existing = await restRequest<DailySessionDto | null>(
      `/daily-sessions/current?timezone=${encodeURIComponent(timezone)}`,
    );
    if (existing) return existing;
    return restRequest<DailySessionDto>("/daily-sessions/current", {
      method: "PUT",
      body: JSON.stringify({ timezone }),
    });
  },
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
