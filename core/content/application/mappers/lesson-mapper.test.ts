import { describe, expect, it } from "vitest";
import { lesson } from "@/test/support/core-fakes";
import { toLessonDetailDto, toLessonSummaryDto } from "./lesson-mapper";

describe("lesson mappers", () => {
  it("maps published lessons to summaries without detail fields", () => {
    const dto = toLessonSummaryDto(lesson);
    expect(dto).toMatchObject({ id: "lesson-1", status: "new", title: "Lesson" });
    expect(dto).not.toHaveProperty("explanation");
  });

  it("maps draft lessons as viewed and includes details only in detail DTO", () => {
    const draft = { ...lesson, status: "draft" as const };
    expect(toLessonSummaryDto(draft).status).toBe("viewed");
    expect(toLessonDetailDto(draft)).toMatchObject({
      explanation: lesson.explanation,
      examples: lesson.examples,
      commonMistakes: lesson.commonMistakes,
      relatedActivityIds: lesson.relatedActivityIds,
    });
  });
});
