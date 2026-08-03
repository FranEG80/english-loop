import type { IdentityPort } from "@/core/account/ports/identity-port";
import type { TaxonomyProgressDto } from "@/core/models/progress";
import type { ProgressRepository } from "../../ports/progress-repository";

export async function getTaxonomyProgress(
  identity: IdentityPort,
  repository: ProgressRepository,
  taxonomyNodeId: string,
): Promise<TaxonomyProgressDto> {
  const actor = await identity.requireActor();
  const progress = await repository.getTaxonomyProgress(actor.userId, taxonomyNodeId);
  const attemptsCount = progress?.attemptsCount ?? 0;
  const correctCount = progress?.correctCount ?? 0;
  return {
    taxonomyNodeId,
    attemptsCount,
    correctCount,
    accuracyRate: attemptsCount > 0 ? correctCount / attemptsCount : 0,
  };
}
