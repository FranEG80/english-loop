import type { IdentityPort } from "@/core/account/ports/identity-port";
import type { ReviewRepository } from "../../ports/review-repository";
import type { ReviewQueueDto, ReviewQueueItemDto } from "@/core/models/types/review";
import type { PedagogicalMetricsPort } from "@/core/shared/kernel";

/** Obtiene la cola de repaso del usuario autenticado. */
export async function getReviewQueue(
  identity: IdentityPort,
  reviewRepository: ReviewRepository,
  nowIso: string,
  metrics?: PedagogicalMetricsPort,
): Promise<ReviewQueueDto> {
  const actor = await identity.requireActor();
  const [due, upcoming] = await Promise.all([
    reviewRepository.findDueByUserId(actor.userId, nowIso),
    reviewRepository.findUpcomingByUserId(actor.userId, nowIso),
  ]);

  const toDto = (item: (typeof due)[number]): ReviewQueueItemDto => ({
    id: item.id,
    activityId: item.activityId,
    taxonomyNodeId: item.taxonomyNodeId,
    level: item.level,
    failedAt: item.failedAt,
    dueAt: item.dueAt,
    attemptsCount: item.attemptsCount,
  });
  metrics?.recordReviewQueueSize(due.length);

  return {
    dueItems: due.map(toDto),
    upcomingItems: upcoming.map(toDto),
  };
}
