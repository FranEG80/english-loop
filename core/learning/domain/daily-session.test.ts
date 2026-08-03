import { describe, expect, it } from "vitest";
import { DailySession } from "@/core/learning/domain/daily-session";
import { InvalidSessionTransitionException } from "@/core/shared/exceptions";

function makeSession(overrides: Partial<Parameters<typeof DailySession.create>[0]> = {}) {
  return DailySession.create({
    id: "session-1",
    userId: "u1",
    date: "2026-08-03",
    status: "not_started",
    datasetVersion: "0.1.0",
    seed: "seed-1",
    lessons: [
      {
        lessonId: "lesson-1",
        order: 0,
        status: "pending",
        selectionReason: "new",
        completedAt: null,
      },
    ],
    practiceRunId: null,
    createdAt: "2026-08-03T00:00:00.000Z",
    ...overrides,
  });
}

describe("DailySession", () => {
  it("starts the lesson phase from not_started", () => {
    const session = makeSession();
    session.startLessonPhase("2026-08-03T09:00:00.000Z");
    expect(session.status).toBe("lesson");
  });

  it("cannot start lesson phase from completed", () => {
    const session = makeSession({ status: "completed" });
    expect(() => session.startLessonPhase("2026-08-03T09:00:00.000Z")).toThrow(
      InvalidSessionTransitionException,
    );
  });

  it("completes a lesson", () => {
    const session = makeSession({ status: "lesson" });
    session.completeLesson("lesson-1", "2026-08-03T10:00:00.000Z");
    expect(session.lessons[0].status).toBe("completed");
    expect(session.lessons[0].completedAt).toBe("2026-08-03T10:00:00.000Z");
  });

  it("skips a lesson", () => {
    const session = makeSession({ status: "lesson" });
    session.skipLesson("lesson-1", "2026-08-03T10:30:00.000Z");
    expect(session.lessons[0].status).toBe("skipped");
  });

  it("completes the session from practice phase", () => {
    const session = makeSession({ status: "practice" });
    session.complete("2026-08-03T11:00:00.000Z");
    expect(session.status).toBe("completed");
  });

  it("cannot complete from lesson phase", () => {
    const session = makeSession({ status: "lesson" });
    expect(() => session.complete("2026-08-03T11:00:00.000Z")).toThrow(
      InvalidSessionTransitionException,
    );
  });
});
