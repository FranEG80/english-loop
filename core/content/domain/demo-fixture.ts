/**
 * Identidad y selección editorial de la experiencia pública de demostración.
 *
 * Estos valores se comparten entre el seed y los adaptadores de lectura para
 * que el contenido de demo tenga una única referencia y no se desincronice
 * con los ficheros del dataset.
 */
export const DEMO_USER_ID = "user-demo";
export const DEMO_USER_EMAIL = "demo@englishloop.local";
export const DEMO_USER_NAME = "Alex";
export const DEMO_USER_ACTIVE_LEVELS = ["B1", "B2"] as const;
export const DEMO_DAILY_GOAL_ACTIVITIES = 3;

export const DEMO_LESSON_IDS = [
  "b1-grammar-future-forms-will-going-to",
  "b1-grammar-present-simple-continuous",
  "b1-grammar-first-conditional",
  "b1-phrasal-verbs-everyday-actions",
  "b2-use-of-english-key-word-transformations",
  "b1-grammar-second-conditional",
] as const;

const demoLessonIds = new Set<string>(DEMO_LESSON_IDS);

export function isDemoLessonId(lessonId: string): boolean {
  return demoLessonIds.has(lessonId);
}

export function isDemoActivity(lessonIds: readonly string[]): boolean {
  return lessonIds.some(isDemoLessonId);
}
