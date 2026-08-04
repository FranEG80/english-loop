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

  it("rejects starting lesson phase from every other phase", () => {
    for (const status of ["lesson", "practice"] as const) {
      const session = makeSession({ status });
      expect(() => session.startLessonPhase("2026-08-03T09:00:00.000Z")).toThrow(
        InvalidSessionTransitionException,
      );
    }
  });

  it("completes a lesson", () => {
    const session = makeSession({ status: "lesson" });
    session.completeLesson("lesson-1", "2026-08-03T10:00:00.000Z");
    expect(session.lessons[0].status).toBe("completed");
    expect(session.lessons[0].completedAt).toBe("2026-08-03T10:00:00.000Z");
  });

  it("ignores completing an already completed lesson and rejects an unknown lesson", () => {
    const session = makeSession({
      status: "lesson",
      lessons: [{ lessonId: "lesson-1", order: 0, status: "completed", selectionReason: "new", completedAt: "old" }],
    });
    session.completeLesson("lesson-1", "new");
    expect(session.lessons[0]?.completedAt).toBe("old");
    expect(() => session.completeLesson("missing", "now")).toThrow(InvalidSessionTransitionException);
  });

  it("skips a lesson", () => {
    const session = makeSession({ status: "lesson" });
    session.skipLesson("lesson-1", "2026-08-03T10:30:00.000Z");
    expect(session.lessons[0].status).toBe("skipped");
  });

  it("does not overwrite completed lessons when skipping and rejects unknown lessons", () => {
    const session = makeSession({
      status: "lesson",
      lessons: [{ lessonId: "lesson-1", order: 0, status: "completed", selectionReason: "new", completedAt: "old" }],
    });
    session.skipLesson("lesson-1", "new");
    expect(session.lessons[0]?.status).toBe("completed");
    expect(() => session.skipLesson("missing", "now")).toThrow(InvalidSessionTransitionException);
  });

  it("starts practice only after all lessons are completed or skipped", () => {
    const pending = makeSession({ status: "lesson" });
    expect(() => pending.startPracticePhase()).toThrow(InvalidSessionTransitionException);
    const ready = makeSession({
      status: "lesson",
      lessons: [{ lessonId: "lesson-1", order: 0, status: "skipped", selectionReason: "review", completedAt: null }],
    });
    ready.startPracticePhase();
    expect(ready.status).toBe("practice");
    expect(() => makeSession({ status: "not_started" }).startPracticePhase()).toThrow(InvalidSessionTransitionException);
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

  it("is idempotent when completed and rejects completion from not_started", () => {
    const completed = makeSession({ status: "completed" });
    completed.complete("now");
    expect(completed.status).toBe("completed");
    expect(() => makeSession({ status: "not_started" }).complete("now")).toThrow(InvalidSessionTransitionException);
  });

  it("attaches one practice run and rejects a different one", () => {
    const session = makeSession();
    session.attachPracticeRun("run-1");
    session.attachPracticeRun("run-1");
    expect(session.practiceRunId).toBe("run-1");
    expect(() => session.attachPracticeRun("run-2")).toThrow(InvalidSessionTransitionException);
  });

  it("records practice-start events and exposes immutable snapshots", () => {
    const session = makeSession();
    session.recordPracticeStarted("now", "run-1");
    expect(session.pullDomainEvents()).toHaveLength(1);
    const snapshot = session.toSnapshot();
    snapshot.lessons[0]!.status = "completed";
    expect(session.lessons[0]?.status).toBe("pending");
  });
});
