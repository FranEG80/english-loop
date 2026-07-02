import type { ReviewQueueDto } from "@/core/models";

export const mockReviewQueue: ReviewQueueDto = {
  dueItems: [
    {
      id: "review-item-1",
      activityId: "activity-error-correction-first-conditional",
      taxonomyNodeId: "grammar.conditionals.first",
      level: "B1",
      failedAt: "2026-06-25T09:12:00.000Z",
      dueAt: "2026-06-28T00:00:00.000Z",
      attemptsCount: 1,
    },
    {
      id: "review-item-2",
      activityId: "activity-rewrite-sentence-prepositions",
      taxonomyNodeId: "prepositions.general",
      level: "B2",
      failedAt: "2026-06-27T18:40:00.000Z",
      dueAt: "2026-06-30T00:00:00.000Z",
      attemptsCount: 2,
    },
  ],
  upcomingItems: [
    {
      id: "review-item-3",
      activityId: "activity-word-formation-general",
      taxonomyNodeId: "word-formation.general",
      level: "B2",
      failedAt: "2026-06-29T08:05:00.000Z",
      dueAt: "2026-07-05T00:00:00.000Z",
      attemptsCount: 1,
    },
  ],
};
