import type { Lesson } from "../../domain/types/lesson";
import type { LessonCatalogPort } from "../../ports/catalog-ports";
import type { CefrLevel } from "@/core/models/level";
import type { CursorPage, CursorPaginationParams } from "@/core/shared/kernel";
import type { LessonCatalogPagePort } from "../../ports/catalog-ports";

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

export async function listLessonsPage(
  catalog: LessonCatalogPagePort,
  input: ListLessonsInput & { pagination: CursorPaginationParams },
): Promise<CursorPage<Lesson>> {
  return catalog.listLessonsPage(
    { category: input.category, level: input.level },
    input.pagination,
  );
}

/** Obtiene una lección por ID. */
export async function getLesson(
  catalog: LessonCatalogPort,
  lessonId: string,
): Promise<Lesson | null> {
  return catalog.getLessonById(lessonId);
}
