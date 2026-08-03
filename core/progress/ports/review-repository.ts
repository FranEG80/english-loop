import type { ReviewItem } from "../domain/review-item";

export interface ReviewRepository {
  findByUserIdAndActivity(
    userId: string,
    activityId: string,
  ): Promise<ReviewItem | null>;
  findDueByUserId(userId: string, nowIso: string): Promise<ReviewItem[]>;
  findUpcomingByUserId(userId: string, nowIso: string): Promise<ReviewItem[]>;
  save(item: ReviewItem): Promise<void>;
}
