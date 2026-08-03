import type { Lesson } from "@/core/content/domain/types/lesson";
import type { LessonCatalogPort } from "@/core/content/ports/catalog-ports";
import type { RandomSourcePort } from "@/core/shared/kernel";

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

    const newLessons = lessons.filter(
      (lesson) => !viewedSet.has(lesson.id) && !errorSet.has(lesson.id),
    );
    const errorLessons = lessons.filter((lesson) => errorSet.has(lesson.id));
    const reuseLessons = lessons.filter((lesson) => viewedSet.has(lesson.id));

    const selections: LessonSelection[] = [];

    // 1. Recuperar primero los errores que todavía bloquean la lección.
    for (const lesson of this.pick(errorLessons, input.count - selections.length)) {
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
