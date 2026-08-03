import type { IdentityPort } from "@/core/account/ports/identity-port";
import type { ProgressRepository } from "../../ports/progress-repository";
import type { ReviewRepository } from "../../ports/review-repository";

export interface DashboardSummaryDto {
  streakDays: number;
  accuracyRate: number;
  totalActivitiesCompleted: number;
  pendingReviewCount: number;
  strongTopicIds: string[];
  weakTopicIds: string[];
}

/** Resumen para el dashboard del usuario autenticado. */
export async function getDashboardSummary(
  identity: IdentityPort,
  progressRepository: ProgressRepository,
  reviewRepository: ReviewRepository,
  nowIso: string,
): Promise<DashboardSummaryDto> {
  const actor = await identity.requireActor();
  const [overview, pendingReviews] = await Promise.all([
    progressRepository.getOverview(actor.userId),
    reviewRepository.findDueByUserId(actor.userId, nowIso),
  ]);

  return {
    streakDays: 0,
    accuracyRate:
      overview.totalAttempts > 0
        ? overview.totalCorrect / overview.totalAttempts
        : 0,
    totalActivitiesCompleted: overview.totalActivitiesCompleted,
    pendingReviewCount: pendingReviews.length,
    strongTopicIds: overview.strongTopicIds,
    weakTopicIds: overview.weakTopicIds,
  };
}
