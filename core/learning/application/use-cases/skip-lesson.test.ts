import { describe, expect, it } from "vitest";
import { clock, collectEvents, identity, makeDailySession, MemorySessions, uow } from "@/test/support/core-fakes";
import { skipLesson } from "./skip-lesson";

describe("skipLesson", () => {
  it("changes the assignment, persists it and publishes the domain event", async () => {
    const repository = new MemorySessions();
    const session = makeDailySession("skip", "lesson");
    await repository.save(session);
    const { events, dispatcher } = collectEvents();
    const result = await skipLesson(identity, uow, repository, session.id, "lesson-1", clock.nowIso(), dispatcher);
    expect(result.lessons[0]?.status).toBe("skipped");
    expect(events.map((event) => event.eventName)).toContain("LessonSkipped");
  });
});
