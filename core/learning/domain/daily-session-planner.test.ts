import { describe, expect, it } from "vitest";
import type { Lesson } from "@/core/content/domain/types/lesson";
import type { LessonCatalogPort } from "@/core/content/ports/catalog-ports";
import { DailySessionPlanner } from "./daily-session-planner";

const makeLesson = (id: string): Lesson => ({
  id,
  level: "B1",
  category: "grammar",
  taxonomyNodeId: "topic",
  title: id,
  summary: id,
  explanation: id,
  examples: [],
  commonMistakes: [],
  relatedActivityIds: [],
  tags: [],
  difficulty: 1,
  status: "published",
  contentVersion: 1,
});

const lessons = [makeLesson("new-1"), makeLesson("new-2"), makeLesson("review-1"), makeLesson("seen-1")];
const catalog: LessonCatalogPort = {
  listLessons: async () => lessons,
  getLessonById: async (lessonId) => lessons.find(({ id }) => id === lessonId) ?? null,
};
const random = {
  int: () => 0,
  float: () => 0,
  shuffle: <T>(items: readonly T[]) => [...items],
};

describe("DailySessionPlanner", () => {
  it("prioritizes lessons with real pending errors, then new lessons, then reuse", async () => {
    const planner = new DailySessionPlanner(random);

    const result = await planner.plan(catalog, {
      level: "B1",
      viewedLessonIds: ["seen-1"],
      errorLessonIds: ["review-1"],
      count: 4,
    });

    expect(result).toEqual([
      { lessonId: "review-1", selectionReason: "review" },
      { lessonId: "new-1", selectionReason: "new" },
      { lessonId: "new-2", selectionReason: "new" },
      { lessonId: "seen-1", selectionReason: "reuse" },
    ]);
  });

  it("does not return more lessons than are available", async () => {
    const planner = new DailySessionPlanner(random);

    const result = await planner.plan(catalog, {
      level: "B1",
      viewedLessonIds: [],
      errorLessonIds: [],
      count: 20,
    });

    expect(result).toHaveLength(4);
    expect(new Set(result.map(({ lessonId }) => lessonId)).size).toBe(4);
  });
});
