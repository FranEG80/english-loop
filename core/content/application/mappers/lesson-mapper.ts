import type { Lesson } from "../../domain/lesson";
import type { LessonDetailDto, LessonSummaryDto } from "@/core/models/lesson";

/** Convierte una lección de dominio a DTO de resumen. */
export function toLessonSummaryDto(lesson: Lesson): LessonSummaryDto {
  return {
    id: lesson.id,
    level: lesson.level,
    category: lesson.category,
    taxonomyNodeId: lesson.taxonomyNodeId,
    title: lesson.title,
    summary: lesson.summary,
    tags: lesson.tags,
    difficulty: lesson.difficulty,
    status: lesson.status === "published" ? "new" : "viewed",
  };
}

/** Convierte una lección de dominio a DTO de detalle. */
export function toLessonDetailDto(lesson: Lesson): LessonDetailDto {
  return {
    ...toLessonSummaryDto(lesson),
    explanation: lesson.explanation,
    examples: lesson.examples,
    commonMistakes: lesson.commonMistakes,
    relatedActivityIds: lesson.relatedActivityIds,
  };
}
