import type { ProgressOverviewDto } from "../models/progress";
import type { ReviewQueueDto } from "../models/review";

export interface ProgressPort {
  getOverview(): Promise<ProgressOverviewDto>;
  getReviewQueue(): Promise<ReviewQueueDto>;
}
