import type { Lesson } from "@/core/content/domain/types/lesson";
import type { LessonCatalogPort } from "@/core/content/ports/catalog-ports";
import type { RandomSourcePort } from "@/core/shared/kernel";

const MAX_REVIEW_RATIO = 0.3;

export interface LessonSelectionInput {
  level: string;
  /** Lecciones ya vistas (sin errores pendientes). */
  viewedLessonIds: string[];
  /** Lecciones con errores pendientes (recapitulación). */
  errorLessonIds: string[];
  /** Número de lecciones a seleccionar. */
  count: number;
}

export interface LessonSelection {
  lessonId: string;
  selectionReason: "new" | "review" | "reuse";
}

/**
 * Planifica las lecciones de la sesión diaria:
 * - Prioriza lecciones con errores pendientes reales.
 * - Después incorpora lecciones no vistas.
 * - No repite lecciones vistas sin errores mientras exista contenido nuevo.
 * - Reutiliza contenido visto cuando se agota el contenido nuevo.
 */
export class DailySessionPlanner {
  constructor(private readonly random: RandomSourcePort) {}

  async plan(
    catalog: LessonCatalogPort,
    input: LessonSelectionInput,
  ): Promise<LessonSelection[]> {
    const lessons = await catalog.listLessons({ level: input.level as never });

    const viewedSet = new Set(input.viewedLessonIds);
    const errorSet = new Set(input.errorLessonIds);
    const completedSet = new Set(input.viewedLessonIds);
    const eligible = lessons.filter((lesson) =>
      lesson.prerequisiteLessonIds.every((prerequisiteId) => completedSet.has(prerequisiteId)),
    );

    const newLessons = eligible.filter(
      (lesson) => !viewedSet.has(lesson.id) && !errorSet.has(lesson.id),
    );
    const errorLessons = eligible.filter((lesson) => errorSet.has(lesson.id));
    const reuseLessons = eligible.filter((lesson) => viewedSet.has(lesson.id));

    const selections: LessonSelection[] = [];

    // Cuando todavía existe contenido nuevo, los repasos ocupan como máximo
    // el 30% de la sesión. Si no queda contenido nuevo, los errores sí pueden
    // rellenar toda la sesión para no dejar al usuario sin práctica útil.
    const reviewLimit = newLessons.length > 0
      ? Math.floor(input.count * MAX_REVIEW_RATIO)
      : input.count;

    // 1. Recuperar primero los errores dentro del límite de repaso.
    for (const lesson of this.pick(errorLessons, Math.min(reviewLimit, input.count))) {
      selections.push({ lessonId: lesson.id, selectionReason: "review" });
    }

    // 2. Lecciones nuevas.
    if (selections.length < input.count) {
      for (const lesson of this.pick(newLessons, input.count - selections.length)) {
        selections.push({ lessonId: lesson.id, selectionReason: "new" });
      }
    }

    // 3. Reutilizar contenido visto cuando se agota el nuevo.
    if (selections.length < input.count) {
      for (const lesson of this.pick(
        reuseLessons,
        input.count - selections.length,
      )) {
        selections.push({ lessonId: lesson.id, selectionReason: "reuse" });
      }
    }

    return selections;
  }

  private pick(lessons: Lesson[], count: number): Lesson[] {
    const shuffled = this.random.shuffle(lessons);
    return shuffled.slice(0, count);
  }
}
