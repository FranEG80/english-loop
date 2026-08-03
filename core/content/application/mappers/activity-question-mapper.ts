import type { Activity } from "../../domain/types/activity";
import type { ActivityQuestionDto, InteractionMode } from "@/core/models/types/activity";

/**
 * Convierte una actividad de catálogo (lado servidor, con evaluador) en un
 * DTO de pregunta seguro para el cliente. NUNCA incluye el evaluador, la
 * respuesta correcta ni la explicación.
 */
export function toActivityQuestionDto(activity: Activity): ActivityQuestionDto {
  const base = {
    id: activity.id,
    level: activity.level,
    taxonomyNodeId: activity.taxonomyNodeIds[0],
    interactionMode: toInteractionMode(activity.type),
  };

  switch (activity.type) {
    case "true_false":
      return { ...base, type: "true_false", statement: activity.prompt };
    case "single_choice":
      return {
        ...base,
        type: "single_choice",
        question: activity.prompt,
        options: (activity.options ?? []).map((option) => ({
          id: option.id,
          label: option.text,
        })),
      };
    case "multiple_select":
      return {
        ...base,
        type: "multiple_choice",
        question: activity.prompt,
        options: (activity.options ?? []).map((option) => ({
          id: option.id,
          label: option.text,
        })),
      };
    case "fill_blank":
      return { ...base, type: "fill_blank", textWithGap: activity.prompt };
    case "word_order":
      return {
        ...base,
        type: "word_order",
        shuffledWords: (activity.tokens ?? []).map((token) => token.text),
      };
    case "matching":
      return {
        ...base,
        type: "matching",
        leftItems: (activity.pairs ?? []).map((pair) => ({
          id: pair.leftId,
          label: pair.left,
        })),
        rightItems: (activity.pairs ?? []).map((pair) => ({
          id: pair.rightId,
          label: pair.right,
        })),
      };
    case "sentence_transformation":
      return {
        ...base,
        type: "sentence_transformation",
        originalSentence: activity.prompt,
        instructionHint: activity.instructions,
        wordBank: (activity.tokens ?? []).map((token) => token.text),
      };
    case "error_correction":
      return {
        ...base,
        type: "error_correction",
        sentenceWithError: activity.prompt,
      };
    case "word_formation":
      return {
        ...base,
        type: "word_formation",
        sentenceWithGap: activity.prompt,
        baseWord: activity.tokens?.[0]?.text ?? "",
      };
    case "open_cloze":
      return {
        ...base,
        type: "open_cloze",
        textWithGaps: activity.prompt,
        gapCount: activity.tokens?.length ?? 0,
      };
    case "key_word_transformation":
      return {
        ...base,
        type: "key_word_transformation",
        firstSentence: activity.prompt,
        keyword: activity.tokens?.[0]?.text ?? "",
        secondSentenceStart: activity.instructions,
      };
    case "complete_dialogue":
      return {
        ...base,
        type: "complete_dialogue",
        dialogueLines: (activity.tokens ?? []).map((token) => ({
          speaker: token.id,
          text: token.text,
          hasGap: false,
        })),
      };
    case "complete_paragraph":
      return {
        ...base,
        type: "complete_paragraph",
        paragraphWithGaps: activity.prompt,
        gapCount: activity.tokens?.length ?? 0,
      };
    default:
      // Fallback seguro: no exponer datos sensibles.
      return { ...base, type: "fill_blank", textWithGap: activity.prompt };
  }
}

function toInteractionMode(type: string): InteractionMode {
  switch (type) {
    case "matching":
      return "matching_pairs";
    case "word_order":
      return "sentence_builder";
    default:
      return "standard";
  }
}
