export type DailySessionStatus =
  | "not_started"
  | "lesson"
  | "practice"
  | "completed";

export interface DailySessionGoalDto {
  targetActivities: number;
  completedActivities: number;
}

export interface DailySessionDto {
  id: string;
  /** Día local del usuario en formato ISO (YYYY-MM-DD). */
  date: string;
  status: DailySessionStatus;
  recommendedLessonId: string;
  /** Run asociado cuando la sesión ya ha entrado en práctica. */
  practiceRunId: string | null;
  activityIds: string[];
  goal: DailySessionGoalDto;
  streakDays: number;
}
