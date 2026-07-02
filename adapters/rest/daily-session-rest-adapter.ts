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
      `/daily-session?timezone=${encodeURIComponent(timezone)}`,
    ),
  submitDailyAttempt: (sessionId, input: SubmitAttemptInputDto) =>
    restRequest<AttemptFeedbackDto>(`/daily-session/${sessionId}/attempts`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  completeDailySession: (sessionId) =>
    restRequest<DailySessionDto>(`/daily-session/${sessionId}/complete`, {
      method: "POST",
    }),
};
