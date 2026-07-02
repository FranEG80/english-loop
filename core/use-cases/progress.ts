import type {
  ProgressOverviewDto,
  ReviewQueueDto,
  TaxonomyNodeDto,
} from "@/core/models";
import type {
  LearningContentPort,
  ProgressPort,
} from "@/core/ports";

export interface ProgressSnapshot {
  overview: ProgressOverviewDto;
  reviewQueue: ReviewQueueDto;
  taxonomy: TaxonomyNodeDto[];
}

export async function getProgressSnapshot(
  progress: ProgressPort,
  content: LearningContentPort,
): Promise<ProgressSnapshot> {
  const [overview, reviewQueue, taxonomy] = await Promise.all([
    progress.getOverview(),
    progress.getReviewQueue(),
    content.getTaxonomyTree(),
  ]);
  return { overview, reviewQueue, taxonomy };
}
