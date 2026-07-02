import type { ActivityType } from "@/core/models";

/**
 * Registro de presentación: asocia cada tipo de actividad con su
 * ilustración en `public/illustrations/activities/`. El DTO público
 * (`ActivityQuestionDto`) nunca incluye rutas de assets.
 */
export const ACTIVITY_ILLUSTRATION_BY_TYPE: Record<ActivityType, string> = {
  true_false: "/illustrations/activities/true-false.webp",
  single_choice: "/illustrations/activities/single-choice.webp",
  multiple_choice: "/illustrations/activities/multiple-choice.webp",
  fill_blank: "/illustrations/activities/fill-blank.webp",
  sentence_transformation:
    "/illustrations/activities/sentence-transformation.webp",
  error_correction: "/illustrations/activities/error-correction.webp",
  word_formation: "/illustrations/activities/word-formation.webp",
  open_cloze: "/illustrations/activities/open-cloze.webp",
  key_word_transformation:
    "/illustrations/activities/key-word-transformation.webp",
  matching: "/illustrations/activities/matching.webp",
  word_order: "/illustrations/activities/word-order.webp",
  rewrite_sentence: "/illustrations/activities/rewrite-sentence.webp",
  complete_dialogue: "/illustrations/activities/complete-dialogue.webp",
  complete_paragraph: "/illustrations/activities/complete-paragraph.webp",
};
