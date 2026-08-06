import type { ActivityType } from "@/core/models";

const activityTypeLabels: Record<ActivityType, string> = {
  true_false: "True or false",
  single_choice: "Single choice",
  multiple_choice: "Multiple choice",
  fill_blank: "Fill in the blank",
  sentence_transformation: "Sentence transformation",
  error_correction: "Error correction",
  word_formation: "Word formation",
  open_cloze: "Open cloze",
  key_word_transformation: "Keyword transformation",
  matching: "Matching",
  word_order: "Word order",
  rewrite_sentence: "Rewrite the sentence",
  complete_dialogue: "Complete the dialogue",
  complete_paragraph: "Complete the paragraph",
};

/** Turns an internal activity id into a short title suitable for the UI. */
export function formatActivityTitle(id: string, level: string): string {
  const withoutLevel = id.replace(new RegExp(`^${level.toLowerCase()}-`, "i"), "");
  const withoutFormatCode = withoutLevel.replace(/-([a-z]{2,4})-\d+$/i, "");

  return withoutFormatCode
    .replaceAll("-", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function formatActivityType(type: ActivityType): string {
  return activityTypeLabels[type];
}
