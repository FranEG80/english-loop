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
export const DEMO_PROGRESS_ACTIVITY_LIMIT = 37;

export const DEMO_LESSON_IDS = [
  "b1-grammar-future-forms-will-going-to",
  "b1-grammar-present-simple-continuous",
  "b1-grammar-first-conditional",
  "b1-phrasal-verbs-everyday-actions",
  "b2-use-of-english-key-word-transformations",
  "b1-grammar-second-conditional",
] as const;

/** Curated activity sample for the public demo; the full catalog stays public content. */
export const DEMO_ACTIVITY_IDS = [
  "b1-first-conditional-ec-001",
  "b1-first-conditional-ec-002",
  "b1-first-conditional-ec-003",
  "b1-first-conditional-ec-004",
  "b1-first-conditional-ec-005",
  "b1-first-conditional-ec-006",
  "b1-first-conditional-ec-007",
  "b1-first-conditional-ec-008",
  "b1-first-conditional-ec-009",
  "b1-first-conditional-ec-010",
  "b1-first-conditional-ec-011",
  "b1-first-conditional-ec-012",
] as const;

const demoLessonIds = new Set<string>(DEMO_LESSON_IDS);
const demoActivityIds = new Set<string>(DEMO_ACTIVITY_IDS);

export function isDemoLessonId(lessonId: string): boolean {
  return demoLessonIds.has(lessonId);
}

export function isDemoActivityId(activityId: string): boolean {
  return demoActivityIds.has(activityId);
}

export const DEMO_PROGRESS_ACTIVITY_LIMIT = DEMO_ACTIVITY_IDS.length;
