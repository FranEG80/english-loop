import type { CefrLevel } from "./level";

export type ActivityType =
  | "true_false"
  | "single_choice"
  | "multiple_choice"
  | "fill_blank"
  | "sentence_transformation"
  | "error_correction"
  | "word_formation"
  | "open_cloze"
  | "key_word_transformation"
  | "matching"
  | "word_order"
  | "rewrite_sentence"
  | "complete_dialogue"
  | "complete_paragraph";

/** Cómo se presenta/interactúa con la actividad; no decide cómo se corrige. */
export type InteractionMode =
  | "standard"
  | "swipe"
  | "drag_drop"
  | "matching_pairs"
  | "sentence_builder";

export interface ActivityOptionDto {
  id: string;
  label: string;
}

export interface DialogueLineDto {
  speaker: string;
  text: string;
  hasGap: boolean;
}

interface ActivityBaseDto {
  id: string;
  level: CefrLevel;
  taxonomyNodeId: string;
  interactionMode: InteractionMode;
}

export interface TrueFalseActivityDto extends ActivityBaseDto {
  type: "true_false";
  statement: string;
  /** Mazo opcional para resolver varias afirmaciones dentro del mismo swipe. */
  statements?: Array<{ id: string; statement: string }>;
}

export interface SingleChoiceActivityDto extends ActivityBaseDto {
  type: "single_choice";
  question: string;
  options: ActivityOptionDto[];
}

export interface MultipleChoiceActivityDto extends ActivityBaseDto {
  type: "multiple_choice";
  question: string;
  options: ActivityOptionDto[];
}

export interface FillBlankActivityDto extends ActivityBaseDto {
  type: "fill_blank";
  /** Usa "___" como marcador del hueco. */
  textWithGap: string;
}

export interface SentenceTransformationActivityDto extends ActivityBaseDto {
  type: "sentence_transformation";
  originalSentence: string;
  instructionHint: string;
  wordBank: string[];
}

export interface ErrorCorrectionActivityDto extends ActivityBaseDto {
  type: "error_correction";
  sentenceWithError: string;
}

export interface WordFormationActivityDto extends ActivityBaseDto {
  type: "word_formation";
  sentenceWithGap: string;
  baseWord: string;
}

export interface OpenClozeActivityDto extends ActivityBaseDto {
  type: "open_cloze";
  textWithGaps: string;
  gapCount: number;
}

export interface KeyWordTransformationActivityDto extends ActivityBaseDto {
  type: "key_word_transformation";
  firstSentence: string;
  keyword: string;
  secondSentenceStart: string;
}

export interface MatchingActivityDto extends ActivityBaseDto {
  type: "matching";
  leftItems: ActivityOptionDto[];
  rightItems: ActivityOptionDto[];
}

export interface WordOrderActivityDto extends ActivityBaseDto {
  type: "word_order";
  shuffledWords: string[];
}

export interface RewriteSentenceActivityDto extends ActivityBaseDto {
  type: "rewrite_sentence";
  originalSentence: string;
  constraintHint: string;
}

export interface CompleteDialogueActivityDto extends ActivityBaseDto {
  type: "complete_dialogue";
  dialogueLines: DialogueLineDto[];
}

export interface CompleteParagraphActivityDto extends ActivityBaseDto {
  type: "complete_paragraph";
  paragraphWithGaps: string;
  gapCount: number;
}

/**
 * Unión discriminada por `type`. Nunca incluye la respuesta correcta: la
 * corrección vive únicamente en el adapter mock (o, en el futuro, el backend).
 */
export type ActivityQuestionDto =
  | TrueFalseActivityDto
  | SingleChoiceActivityDto
  | MultipleChoiceActivityDto
  | FillBlankActivityDto
  | SentenceTransformationActivityDto
  | ErrorCorrectionActivityDto
  | WordFormationActivityDto
  | OpenClozeActivityDto
  | KeyWordTransformationActivityDto
  | MatchingActivityDto
  | WordOrderActivityDto
  | RewriteSentenceActivityDto
  | CompleteDialogueActivityDto
  | CompleteParagraphActivityDto;
