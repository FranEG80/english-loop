// @vitest-environment node
import { describe, expect, it } from "vitest";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
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

  it("paginates lessons with an opaque stable cursor", async () => {
    const adapter = new FileLessonCatalogAdapter(path.join(process.cwd(), "DATASET"));
    const first = await adapter.listLessonsPage({ level: "B1" }, { limit: 1 });
    expect(first.items).toHaveLength(1);
    expect(first.hasMore).toBe(true);
    const second = await adapter.listLessonsPage({ level: "B1" }, { limit: 1, cursor: first.nextCursor! });
    expect(second.items).toHaveLength(1);
    expect(second.items[0]?.id).not.toBe(first.items[0]?.id);
  });

  it("summarizes temporary lessons and tolerates a missing activity index", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "english-loop-lesson-catalog-"));
    try {
      await mkdir(path.join(root, "catalog", "lessons"), { recursive: true });
      await writeFile(path.join(root, "catalog", "lesson-index.json"), JSON.stringify({ lessons: [{ id: "lesson-temp", path: "catalog/lessons/lesson.md", title: "Temp", level: "B2", category: "grammar", topic: "topic", subtopics: [], difficulty: 2, estimatedMinutes: 5, status: "published", contentVersion: 1 }] }));
      await writeFile(path.join(root, "catalog", "lessons", "lesson.md"), "---\ntags: [temp]\n---\n# Resumen\nFirst paragraph\n\nSecond paragraph\n# Explanation\nBody");
      const adapter = new FileLessonCatalogAdapter(root);
      await expect(adapter.listLessons({ level: "B2", category: "grammar" })).resolves.toMatchObject([{ id: "lesson-temp", summary: "First paragraph Second paragraph", relatedActivityIds: [], tags: ["temp"] }]);
      await expect(adapter.listLessonsPage({ level: "B2", category: "grammar" }, { limit: 1 })).resolves.toMatchObject({ items: [{ id: "lesson-temp", relatedActivityIds: [] }], hasMore: false, nextCursor: null });
      await expect(adapter.listLessonsPage({ level: "B2", category: "vocabulary" }, { limit: 1 })).resolves.toMatchObject({ items: [], hasMore: false, nextCursor: null });
      await expect(adapter.getLessonById("lesson-temp")).resolves.toMatchObject({ id: "lesson-temp" });
      await expect(adapter.listLessons({ level: "B1" })).resolves.toEqual([]);
      await expect(adapter.getLessonById("missing")).resolves.toBeNull();
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("reports a missing lesson index as a dataset outage", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "english-loop-lesson-catalog-invalid-"));
    try {
      await expect(new FileLessonCatalogAdapter(root).listLessons()).rejects.toBeInstanceOf(Error);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
