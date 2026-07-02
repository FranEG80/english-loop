import type { ProgressOverviewDto } from "@/core/models";

export const mockProgressOverview: ProgressOverviewDto = {
  activeLevels: ["B1", "B2"],
  streakDays: 4,
  accuracyRate: 0.78,
  totalLessonsViewed: 9,
  totalActivitiesCompleted: 37,
  strongTopicIds: [
    "grammar.verb-tenses.present.simple",
    "vocabulary.lexical-fields.travel",
  ],
  weakTopicIds: ["grammar.conditionals.first", "prepositions.general"],
  pendingReviewCount: 2,
  weeklyActivity: [
    { date: "2026-06-26", completedActivities: 3, accuracyRate: 0.67 },
    { date: "2026-06-27", completedActivities: 5, accuracyRate: 0.8 },
    { date: "2026-06-28", completedActivities: 2, accuracyRate: 0.5 },
    { date: "2026-06-29", completedActivities: 7, accuracyRate: 0.86 },
    { date: "2026-06-30", completedActivities: 4, accuracyRate: 0.75 },
    { date: "2026-07-01", completedActivities: 8, accuracyRate: 0.88 },
    { date: "2026-07-02", completedActivities: 6, accuracyRate: 0.83 },
  ],
};
