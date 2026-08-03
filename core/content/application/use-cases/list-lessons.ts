import type { Lesson } from "../../domain/lesson";
import type { LessonCatalogPort } from "../../ports/catalog-ports";
import type { CefrLevel } from "@/core/models/level";

export interface ListLessonsInput {
  category?: string;
  level?: CefrLevel;
}

/** Lista lecciones publicadas, opcionalmente filtradas. */
export async function listLessons(
  catalog: LessonCatalogPort,
  input: ListLessonsInput = {},
): Promise<Lesson[]> {
  return catalog.listLessons({
    category: input.category,
    level: input.level,
  });
}

/** Obtiene una lección por ID. */
export async function getLesson(
  catalog: LessonCatalogPort,
  lessonId: string,
): Promise<Lesson | null> {
  return catalog.getLessonById(lessonId);
}
