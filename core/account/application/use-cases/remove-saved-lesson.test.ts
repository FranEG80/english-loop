import { describe, expect, it } from "vitest";
import { removeSavedLesson } from "./remove-saved-lesson";
import { saveLesson } from "./save-lesson";
import { identity, MemorySavedLessons, clock } from "@/test/support/core-fakes";

describe("removeSavedLesson", () => {
  it("removes an existing lesson and tolerates a missing one", async () => {
    const repository = new MemorySavedLessons();
    await saveLesson(identity, repository, "lesson-1", clock.nowIso());

    await removeSavedLesson(identity, repository, "missing");
    await removeSavedLesson(identity, repository, "lesson-1");

    expect(repository.values).toEqual([]);
  });
});
