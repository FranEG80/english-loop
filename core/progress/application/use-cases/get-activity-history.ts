import type { IdentityPort } from "@/core/account/ports/identity-port";
import type { ActivityHistoryDto } from "@/core/models/types/progress";
import type { AttemptRepository } from "@/core/practice/ports/attempt-repository";

export async function getActivityHistory(
  identity: IdentityPort,
  attempts: AttemptRepository,
  activityId: string,
): Promise<ActivityHistoryDto> {
  const actor = await identity.requireActor();
  const records = await attempts.findByUserIdAndActivityId(actor.userId, activityId);
  return {
    activityId,
    attempts: records.map((attempt) => ({
      id: attempt.id,
      isCorrect: attempt.isCorrect,
      submittedAt: attempt.submittedAt,
      origin: attempt.origin,
    })),
  };
}
