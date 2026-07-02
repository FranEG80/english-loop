"use server";

import { getDailySessionPort } from "@/adapters/adapter-factory";
import type { AttemptFeedbackDto, DailySessionDto, SubmitAttemptInputDto } from "@/core/models";

export async function submitDailyAttemptAction(
  sessionId: string,
  input: SubmitAttemptInputDto,
): Promise<AttemptFeedbackDto> {
  return getDailySessionPort().submitDailyAttempt(sessionId, input);
}

export async function completeDailySessionAction(
  sessionId: string,
): Promise<DailySessionDto> {
  return getDailySessionPort().completeDailySession(sessionId);
}
