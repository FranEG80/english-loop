import type { ActivityPresentation, ActivityType } from "@/core/models";
import type { Dictionary } from "@/shared/i18n";

/**
 * Etiquetas de catálogo. Se leen del diccionario para no dejar inglés
 * incrustado en una interfaz bilingüe.
 */
export function formatActivityType(type: ActivityType, dictionary?: Dictionary): string {
  return dictionary?.activityTypes[type] ?? FALLBACK_TYPE_LABELS[type];
}

export function formatPresentation(
  presentation: ActivityPresentation,
  dictionary?: Dictionary,
): string {
  return dictionary?.activityPresentations[presentation] ?? FALLBACK_PRESENTATION_LABELS[presentation];
}

/** Convierte el id interno de una actividad en un título corto para la interfaz. */
export function formatActivityTitle(id: string, level: string): string {
  const withoutLevel = id.replace(new RegExp(`^${level.toLowerCase()}-`, "i"), "");
  const withoutFormatCode = withoutLevel.replace(/-([a-z]{2,4})-\d+$/i, "");

  return withoutFormatCode
    .replaceAll("-", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

const FALLBACK_TYPE_LABELS: Record<ActivityType, string> = {
  gap_fill: "Gap fill",
  single_choice: "Single choice",
  multiple_choice: "Multiple choice",
  true_false: "True or false",
  swipe_deck: "Swipe deck",
  word_order: "Word order",
  matching: "Matching",
  error_correction: "Error correction",
  guided_writing: "Guided writing",
  word_formation: "Word formation",
  key_word_transformation: "Key word transformation",
  sentence_rewrite: "Sentence rewrite",
  mini_game: "Mini game",
};

const FALLBACK_PRESENTATION_LABELS: Record<ActivityPresentation, string> = {
  gap_fill: "Gaps in the sentence",
  key_word_transformation: "Key word transformation",
  choice: "Choose an option",
  true_false: "True or false",
  swipe_deck: "Swipe deck",
  word_order: "Build the sentence",
  matching: "Match the pairs",
  free_text: "Write your answer",
  mini_game: "Mini game",
};
