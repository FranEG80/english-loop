import type { ProgressPort } from "@/core/ports";
import type { ActivityHistoryDto, ProgressOverviewDto, ReviewQueueDto, TaxonomyProgressDto } from "@/core/models";
import { restRequest } from "./http-client";

export const progressRestAdapter: ProgressPort = {
  getOverview: () => restRequest<ProgressOverviewDto>("/progress/overview"),
  getReviewQueue: () => restRequest<ReviewQueueDto>("/progress/review-queue"),
  getTaxonomyProgress: (nodeId) =>
    restRequest<TaxonomyProgressDto>(`/progress/taxonomy/${nodeId}`),
  getActivityHistory: (activityId) =>
    restRequest<ActivityHistoryDto>(`/progress/activities/${activityId}/history`),
};
