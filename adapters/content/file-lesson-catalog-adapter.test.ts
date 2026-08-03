// @vitest-environment node
import { describe, expect, it } from "vitest";
import path from "node:path";
import { FileLessonCatalogAdapter } from "./file-lesson-catalog-adapter";

describe("FileLessonCatalogAdapter", () => {
  it("loads published lessons, filters by level and resolves missing ids", async () => {
    const adapter = new FileLessonCatalogAdapter(path.join(process.cwd(), "DATASET"));
    const lessons = await adapter.listLessons({ level: "B1" });
    expect(lessons.length).toBeGreaterThan(0);
    expect(lessons.every((lesson) => lesson.status === "published" && lesson.level === "B1")).toBe(true);
    expect((await adapter.getLessonById(lessons[0].id))?.explanation).toBeTypeOf("string");
    expect(await adapter.getLessonById("missing")).toBeNull();
  });
});
