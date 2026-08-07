import type { ActivityQuestionDto } from "@/core/models";
import type { Activity } from "@/core/content/domain/types/activity";

/**
 * Fixtures compartidos del modelo v2. Evitan repetir la forma completa del
 * DTO en cada test y hacen que un cambio en el contrato rompa en un solo
 * sitio.
 */

export const NORMALIZATION = {
  trim: true,
  collapseWhitespace: true,
  caseSensitive: false,
  ignoreTerminalPunctuation: true,
  normaliseApostrophes: true,
} as const;

/** Actividad de catálogo (lado servidor, con evaluador). */
export function catalogActivity(overrides: Partial<Activity> = {}): Activity {
  return {
    id: "b1-demo-001",
    level: "B1",
    type: "gap_fill",
    skillFocus: "fill_blank",
    category: "vocabulary",
    topic: "b1-demo",
    subtopic: "b1-demo",
    taxonomyNodeIds: ["b1-demo"],
    difficulty: 2,
    instructions: "Complete the sentence with one word.",
    prompt: "Complete the sentence.",
    gapText: "I booked a return [gap1] to Leeds.",
    gapLayout: "sentence",
    lessonIds: ["b1-demo"],
    tags: ["b1", "demo"],
    estimatedSeconds: 30,
    evaluator: {
      strategy: "per_gap",
      gaps: [{ gapId: "gap1", answers: ["ticket"] }],
      normalization: NORMALIZATION,
    },
    explanation: "A return ticket incluye la ida y la vuelta.",
    status: "published",
    ...overrides,
  };
}

/** DTO de pregunta (lado cliente, sin evaluador). */
export function trueFalseQuestion(
  overrides: Partial<Extract<ActivityQuestionDto, { presentation: "true_false" }>> = {},
): ActivityQuestionDto {
  return {
    id: "activity-1",
    level: "B1",
    taxonomyNodeId: "grammar",
    type: "true_false",
    skillFocus: "true_false",
    presentation: "true_false",
    instructions: "Decide whether the statement is correct.",
    statement: "True?",
    ...overrides,
  };
}

export function gapFillQuestion(
  overrides: Partial<Extract<ActivityQuestionDto, { presentation: "gap_fill" }>> = {},
): ActivityQuestionDto {
  return {
    id: "activity-gap",
    level: "B1",
    taxonomyNodeId: "grammar",
    type: "gap_fill",
    skillFocus: "fill_blank",
    presentation: "gap_fill",
    instructions: "Complete the sentence with one word.",
    layout: "sentence",
    gapIds: ["gap1"],
    segments: [
      { kind: "text", value: "I booked a return " },
      { kind: "gap", gapId: "gap1", position: 1 },
      { kind: "text", value: " to Leeds." },
    ],
    ...overrides,
  };
}

export function choiceQuestion(
  overrides: Partial<Extract<ActivityQuestionDto, { presentation: "choice" }>> = {},
): ActivityQuestionDto {
  return {
    id: "activity-choice",
    level: "B1",
    taxonomyNodeId: "grammar",
    type: "single_choice",
    skillFocus: "single_choice",
    presentation: "choice",
    instructions: "Choose the correct option.",
    question: "Which one fits?",
    selection: "single",
    options: [
      { id: "a", label: "A" },
      { id: "b", label: "B" },
    ],
    ...overrides,
  };
}

export function wordOrderQuestion(
  overrides: Partial<Extract<ActivityQuestionDto, { presentation: "word_order" }>> = {},
): ActivityQuestionDto {
  return {
    id: "activity-word-order",
    level: "B2",
    taxonomyNodeId: "word-order",
    type: "word_order",
    skillFocus: "word_order",
    presentation: "word_order",
    instructions: "Put the fragments in the correct order.",
    tokens: [
      { id: "t1", text: "I" },
      { id: "t2", text: "agree" },
    ],
    ...overrides,
  };
}
