import { describe, expect, it } from "vitest";
import { mapPrismaActivity, mapPrismaLesson } from "./prisma-catalog-mappers";

describe("Prisma catalog mappers", () => {
  it("preserves ordered options, tokens and feedback from the normalized rows", () => {
    const activity = mapPrismaActivity({
      id: "activity-v1",
      activityId: "activity-1",
      levelCode: "B1",
      activityTypeCode: "choice",
      skillFocus: "single_choice",
      category: "grammar",
      topic: "topic",
      subtopic: "subtopic",
      difficulty: 1,
      instructions: "Choose",
      prompt: "Prompt",
      gapText: null,
      gapLayout: null,
      passage: null,
      cueWord: null,
      keyWord: null,
      firstSentence: null,
      optionsOrdered: false,
      game: null,
      cardsData: null,
      roundsData: null,
      explanation: "Explanation",
      tags: "[]",
      lessonIds: '["lesson-1"]',
      estimatedSeconds: 30,
      evaluatorData: JSON.stringify({ strategy: "single_option", correctOptionId: "b" }),
      statusCode: "published",
      options: [
        { optionId: "b", label: "B", feedback: "Good", position: 1 },
        { optionId: "a", label: "A", feedback: null, position: 0 },
      ],
      tokens: [],
      pairs: [],
      lessonLinks: [],
      taxonomyLinks: [{ taxonomyNodeId: "topic", position: 0 }],
    });

    expect(activity.options).toEqual([
      { id: "a", text: "A" },
      { id: "b", text: "B", feedback: "Good" },
    ]);
  });

  it("deduplicates lesson relations and keeps the immutable version id", () => {
    const lesson = mapPrismaLesson(
      {
        id: "lesson-v1",
        lessonId: "lesson-1",
        levelCode: "B1",
        category: "grammar",
        taxonomyNodeId: "topic",
        prerequisites: '["lesson-0"]',
        title: "Lesson",
        summary: "Summary",
        explanation: "Explanation",
        examples: "[]",
        commonMistakes: "[]",
        tags: "[]",
        difficulty: 1,
        statusCode: "published",
        contentVersion: 1,
      },
      ["activity-2", "activity-1", "activity-2"],
    );

    expect(lesson.versionId).toBe("lesson-v1");
    expect(lesson.prerequisiteLessonIds).toEqual(["lesson-0"]);
    expect(lesson.relatedActivityIds).toEqual(["activity-1", "activity-2"]);
  });
});
