import type { ActivityHistoryDto, ProgressOverviewDto, TaxonomyProgressDto } from "../models/types/progress";
import type { ReviewQueueDto } from "../models/types/review";

export interface ProgressPort {
  getOverview(): Promise<ProgressOverviewDto>;
  getReviewQueue(): Promise<ReviewQueueDto>;
  getTaxonomyProgress(nodeId: string): Promise<TaxonomyProgressDto>;
  getActivityHistory(activityId: string): Promise<ActivityHistoryDto>;
}
