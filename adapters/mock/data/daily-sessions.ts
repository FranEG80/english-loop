import type { DailySessionDto } from "@/core/models";

export function buildMockDailySession(date: string): DailySessionDto {
  return {
    id: `daily-${date}`,
    date,
    status: "not_started",
    recommendedLessonId: "lesson-future-forms",
    activityIds: [
      "activity-single-choice-future-forms",
      "activity-true-false-present-simple",
      "activity-fill-blank-past-simple",
    ],
    goal: { targetActivities: 3, completedActivities: 0 },
    streakDays: 4,
  };
}
