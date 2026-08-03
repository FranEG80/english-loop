import type { DailySession } from "../../domain/daily-session";
import type { DailySessionDto } from "@/core/models/daily-session";
import type { PracticeRun } from "@/core/practice/domain/practice-run";

/** Convierte una sesión diaria de dominio a DTO seguro. */
export function toDailySessionDto(
  session: DailySession,
  run?: PracticeRun,
  completedActivities = 0,
): DailySessionDto {
  const pendingLessons = session.lessons.filter(
    (lesson) => lesson.status === "pending",
  );
  return {
    id: session.id,
    date: session.date,
    status: session.status,
    recommendedLessonId: pendingLessons[0]?.lessonId ?? "",
    activityIds: run?.activityIds ?? [],
    goal: {
      targetActivities: run?.activityIds.length ?? 10,
      completedActivities,
    },
    streakDays: 0,
  };
}
