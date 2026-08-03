import type { IdentityPort } from "@/core/account/ports/identity-port";
import type { ProgressRepository } from "../../ports/progress-repository";
import type { ReviewRepository } from "../../ports/review-repository";
import type { ProgressOverviewDto } from "@/core/models/types/progress";

/** Obtiene el resumen de progreso del usuario autenticado. */
export async function getProgressOverview(
  identity: IdentityPort,
  progressRepository: ProgressRepository,
  reviewRepository: ReviewRepository,
  nowIso: string,
): Promise<ProgressOverviewDto> {
  const actor = await identity.requireActor();
  const [overview, pendingReviews] = await Promise.all([
    progressRepository.getOverview(actor.userId),
    reviewRepository.findDueByUserId(actor.userId, nowIso),
  ]);

  const accuracyRate =
    overview.totalAttempts > 0
      ? overview.totalCorrect / overview.totalAttempts
      : 0;

  return {
    activeLevels: actor.activeLevels,
    streakDays: 0,
    accuracyRate,
    totalLessonsViewed: 0,
    totalActivitiesCompleted: overview.totalActivitiesCompleted,
    strongTopicIds: overview.strongTopicIds,
    weakTopicIds: overview.weakTopicIds,
    pendingReviewCount: pendingReviews.length,
    weeklyActivity: [],
  };
}
