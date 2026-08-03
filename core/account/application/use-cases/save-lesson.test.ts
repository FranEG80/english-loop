import { describe, expect, it } from "vitest";
import { saveLesson } from "./save-lesson";
import { identity, MemorySavedLessons, clock } from "@/test/support/core-fakes";

describe("saveLesson", () => {
  it("is idempotent for the same user and lesson", async () => {
    const repository = new MemorySavedLessons();

    await saveLesson(identity, repository, "lesson-1", clock.nowIso());
    await saveLesson(identity, repository, "lesson-1", clock.nowIso());

    expect(repository.values).toHaveLength(1);
    expect(repository.values[0].lessonId).toBe("lesson-1");
  });
});
