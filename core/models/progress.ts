import type { CefrLevel } from "./level";

export interface ProgressOverviewDto {
  activeLevels: CefrLevel[];
  streakDays: number;
  /** Entre 0 y 1. */
  accuracyRate: number;
  totalLessonsViewed: number;
  totalActivitiesCompleted: number;
  /** IDs de nodos de taxonomía; la etiqueta se resuelve contra el árbol. */
  strongTopicIds: string[];
  weakTopicIds: string[];
  pendingReviewCount: number;
  weeklyActivity: Array<{
    date: string;
    completedActivities: number;
    accuracyRate: number;
  }>;
}
