import type { DailySessionPort } from "@/core/ports";
import type { DailySessionDto } from "@/core/models";
import { buildMockDailySession } from "./data/daily-sessions";
import { mockActivities } from "./data/activities";
import { gradeMockAttempt } from "./grading";

/**
 * Estado en memoria del proceso de desarrollo. Se reinicia al reiniciar el
 * servidor; es suficiente para un mock de un único usuario.
 */
const sessionsByDate = new Map<string, DailySessionDto>();

function getLocalDate(timezone: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(
    new Date(),
  );
}

function getOrCreateSession(date: string): DailySessionDto {
  const existing = sessionsByDate.get(date);
  if (existing) return existing;
  const created = buildMockDailySession(date);
  sessionsByDate.set(date, created);
  return created;
}

function findSessionById(sessionId: string): DailySessionDto {
  const session = [...sessionsByDate.values()].find(
    (item) => item.id === sessionId,
  );
  if (!session) {
    throw new Error(`No existe la sesión diaria "${sessionId}".`);
  }
  return session;
}

export const dailySessionMockAdapter: DailySessionPort = {
  async getTodaySession(timezone) {
    return getOrCreateSession(getLocalDate(timezone));
  },

  async submitDailyAttempt(sessionId, input) {
    const session = findSessionById(sessionId);
    const activity = mockActivities.find((item) => item.id === input.activityId);
    if (!activity) {
      throw new Error(`No existe la actividad "${input.activityId}".`);
    }
    const feedback = gradeMockAttempt(activity, input.response);
    session.status = "practice";
    session.goal = {
      ...session.goal,
      completedActivities: Math.min(
        session.goal.targetActivities,
        session.goal.completedActivities + 1,
      ),
    };
    return feedback;
  },

  async completeDailySession(sessionId) {
    const session = findSessionById(sessionId);
    session.status = "completed";
    return session;
  },
};
