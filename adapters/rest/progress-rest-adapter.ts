import type { ProgressPort } from "@/core/ports";
import type { ProgressOverviewDto, ReviewQueueDto } from "@/core/models";
import { restRequest } from "./http-client";

export const progressRestAdapter: ProgressPort = {
  getOverview: () => restRequest<ProgressOverviewDto>("/progress/overview"),
  getReviewQueue: () => restRequest<ReviewQueueDto>("/progress/review-queue"),
};
