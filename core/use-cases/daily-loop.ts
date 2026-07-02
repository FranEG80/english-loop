import type {
  ActivityQuestionDto,
  DailySessionDto,
  LessonDetailDto,
} from "@/core/models";
import type {
  DailySessionPort,
  LearningContentPort,
} from "@/core/ports";

export interface DailyLoopSnapshot {
  dailySession: DailySessionDto;
  lesson: LessonDetailDto | null;
  activities: ActivityQuestionDto[];
}

export async function getDailyLoop(
  dailySessions: DailySessionPort,
  content: LearningContentPort,
  timezone: string,
): Promise<DailyLoopSnapshot> {
  const dailySession = await dailySessions.getTodaySession(timezone);
  const [lesson, fetchedActivities] = await Promise.all([
    content.getLessonById(dailySession.recommendedLessonId),
    Promise.all(
      dailySession.activityIds.map((id) => content.getActivityById(id)),
    ),
  ]);

  return {
    dailySession,
    lesson,
    activities: fetchedActivities.filter(
      (activity): activity is ActivityQuestionDto => activity !== null,
    ),
  };
}
