import type { ProgressPort } from "@/core/ports";
import { mockProgressOverview } from "./data/progress";
import { mockReviewQueue } from "./data/review";

export const progressMockAdapter: ProgressPort = {
  async getOverview() {
    return mockProgressOverview;
  },
  async getReviewQueue() {
    return mockReviewQueue;
  },
  async getTaxonomyProgress(taxonomyNodeId) {
    return { taxonomyNodeId, attemptsCount: 0, correctCount: 0, accuracyRate: 0 };
  },
  async getActivityHistory(activityId) {
    return { activityId, attempts: [] };
  },
};
