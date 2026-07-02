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
};
