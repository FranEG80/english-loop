import { describe, expect, it } from "vitest";
import { completeLesson } from "./complete-lesson";
import { clock, collectEvents, identity, lesson, lessonProgress, MemorySessions, makeDailySession, uow } from "@/test/support/core-fakes";

describe("completeLesson", () => {
  it("updates the session and lesson progress in one use-case operation", async () => {
    const sessions = new MemorySessions();
    const session = makeDailySession("session-complete");
    await sessions.save(session);
    let savedProgress = false;

    await completeLesson(
      identity,
      uow,
      sessions,
      { ...lessonProgress, upsert: async () => { savedProgress = true; } },
      session.id,
      lesson.id,
      clock.nowIso(),
      collectEvents().dispatcher,
    );

    expect(savedProgress).toBe(true);
    expect(session.lessons[0]?.status).toBe("completed");
  });
});
