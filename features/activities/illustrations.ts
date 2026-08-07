import type { ActivityPresentation, ActivityQuestionDto } from "@/core/models";

/**
 * Registro de presentación: asocia cada familia de renderer con su
 * ilustración en `public/illustrations/activities/`. El DTO público
 * (`ActivityQuestionDto`) nunca incluye rutas de assets.
 *
 * Se mapea por presentación y no por tipo porque la ilustración acompaña a
 * cómo se responde la actividad, no a su etiqueta pedagógica.
 */
const BY_PRESENTATION: Record<ActivityPresentation, string> = {
  gap_fill: "/illustrations/activities/fill-blank.webp",
  key_word_transformation: "/illustrations/activities/key-word-transformation.webp",
  choice: "/illustrations/activities/single-choice.webp",
  true_false: "/illustrations/activities/true-false.webp",
  swipe_deck: "/illustrations/activities/true-false.webp",
  word_order: "/illustrations/activities/word-order.webp",
  matching: "/illustrations/activities/matching.webp",
  free_text: "/illustrations/activities/error-correction.webp",
  mini_game: "/illustrations/activities/word-order.webp",
};

/**
 * Excepciones por tipo, cuando dos tipos comparten renderer pero no deberían
 * compartir imagen. `word_formation` reutiliza de momento la ilustración de
 * Part 4: la suya no se entiende y está pendiente de rehacer con una raíz y
 * piezas de sufijo encajando.
 */
const BY_TYPE: Partial<Record<ActivityQuestionDto["type"], string>> = {
  multiple_choice: "/illustrations/activities/multiple-choice.webp",
  sentence_rewrite: "/illustrations/activities/rewrite-sentence.webp",
  guided_writing: "/illustrations/activities/sentence-transformation.webp",
  // Pendiente de rehacer: el diagrama de nodos actual no se lee como
  // sufijación. Hasta entonces se usa la ilustración de Part 4, que al menos
  // comunica «transformar una palabra».
  word_formation: "/illustrations/activities/key-word-transformation.webp",
};

export function activityIllustration(
  activity: Pick<ActivityQuestionDto, "type" | "presentation">,
): string {
  return BY_TYPE[activity.type] ?? BY_PRESENTATION[activity.presentation];
}
