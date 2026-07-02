import type { CefrLevel } from "./level";

export interface ReviewQueueItemDto {
  id: string;
  activityId: string;
  taxonomyNodeId: string;
  level: CefrLevel;
  failedAt: string;
  dueAt: string;
  attemptsCount: number;
}

export interface ReviewQueueDto {
  dueItems: ReviewQueueItemDto[];
  upcomingItems: ReviewQueueItemDto[];
}
