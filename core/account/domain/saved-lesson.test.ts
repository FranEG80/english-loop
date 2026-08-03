import { describe, expect, it } from "vitest";
import { SavedLesson } from "./saved-lesson";

describe("SavedLesson", () => {
  it("creates a saved lesson and exposes its value object data", () => {
    const saved = SavedLesson.create({
      userId: "user-1",
      lessonId: "lesson-1",
      savedAt: "2026-08-04T00:00:00.000Z",
    });

    expect(saved.userId).toBe("user-1");
    expect(saved.lessonId).toBe("lesson-1");
    expect(saved.savedAt).toBe("2026-08-04T00:00:00.000Z");
  });

  it("rejects an empty lesson id", () => {
    expect(() => SavedLesson.create({ userId: "user-1", lessonId: "", savedAt: "now" }))
      .toThrow("lessonId is required");
  });
});
