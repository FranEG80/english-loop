import { describe, expect, it } from "vitest";
import { listSavedLessons } from "./list-saved-lessons";
import { saveLesson } from "./save-lesson";
import { actor, identity, MemorySavedLessons, clock } from "@/test/support/core-fakes";
import { SavedLesson } from "@/core/account/domain/saved-lesson";

describe("listSavedLessons", () => {
  it("returns only lessons saved by the authenticated actor", async () => {
    const repository = new MemorySavedLessons();
    await saveLesson(identity, repository, "lesson-1", clock.nowIso());
    repository.values.push(
      SavedLesson.create({
        userId: "user-2",
        lessonId: "lesson-2",
        savedAt: clock.nowIso(),
      }),
    );

    const result = await listSavedLessons(identity, repository);

    expect(result.map((item) => item.userId)).toEqual([actor.userId]);
  });
});
