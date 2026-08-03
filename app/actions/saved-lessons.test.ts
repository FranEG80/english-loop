import { describe, expect, it, vi } from "vitest";

const root = vi.hoisted(() => ({ identity: {}, savedLessonRepository: {}, clock: { nowIso: vi.fn(() => "now") } }));
const useCases = vi.hoisted(() => ({ saveLesson: vi.fn(), removeSavedLesson: vi.fn() }));
vi.mock("@/server/infrastructure/composition/composition-root", () => ({ compositionRoot: root }));
vi.mock("@/core/account/application/use-cases/save-lesson", () => ({ saveLesson: useCases.saveLesson }));
vi.mock("@/core/account/application/use-cases/remove-saved-lesson", () => ({ removeSavedLesson: useCases.removeSavedLesson }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { removeSavedLessonAction, saveLessonAction } from "./saved-lessons";

describe("saved lessons actions", () => {
  it("saves and removes lessons, invalidating the catalog", async () => {
    await expect(saveLessonAction("lesson-1")).resolves.toEqual({ saved: true });
    await expect(removeSavedLessonAction("lesson-1")).resolves.toEqual({ saved: false });
    expect(useCases.saveLesson).toHaveBeenCalledWith(root.identity, root.savedLessonRepository, "lesson-1", "now");
    expect(useCases.removeSavedLesson).toHaveBeenCalledWith(root.identity, root.savedLessonRepository, "lesson-1");
  });
});
