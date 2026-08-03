import type { ActivityHistoryDto, ProgressOverviewDto, TaxonomyProgressDto } from "../models/progress";
import type { ReviewQueueDto } from "../models/review";

export interface ProgressPort {
  getOverview(): Promise<ProgressOverviewDto>;
  getReviewQueue(): Promise<ReviewQueueDto>;
  getTaxonomyProgress(nodeId: string): Promise<TaxonomyProgressDto>;
  getActivityHistory(activityId: string): Promise<ActivityHistoryDto>;
}
