import type { CefrLevel } from "../level";

/**
 * Tipos canónicos del catálogo. Coinciden 1:1 con
 * `DATASET/schemas/activity.schema.json` y con `scripts/dataset/lib/types.ts`:
 * no hay traducción de vocabularios ni alias.
 */
export const ACTIVITY_TYPES = [
  "gap_fill",
  "single_choice",
  "multiple_choice",
  "true_false",
  "swipe_deck",
  "word_order",
  "matching",
  "error_correction",
  "guided_writing",
  "word_formation",
  "key_word_transformation",
  "sentence_rewrite",
  "mini_game",
] as const;

export type ActivityType = (typeof ACTIVITY_TYPES)[number];

/**
 * Familia de presentación: qué renderer pinta la actividad. Varios tipos
 * comparten familia (`gap_fill` y `word_formation` son ambos huecos en línea),
 * pero cada familia tiene un único DTO, así que el renderer no puede recibir
 * una forma que no sepa pintar.
 */
export const ACTIVITY_PRESENTATIONS = [
  "gap_fill",
  "key_word_transformation",
  "choice",
  "true_false",
  "swipe_deck",
  "word_order",
  "matching",
  "free_text",
  "mini_game",
] as const;

export type ActivityPresentation = (typeof ACTIVITY_PRESENTATIONS)[number];

export const MINI_GAME_IDS = ["frog_leap", "lane_runner", "sentence_tower"] as const;

export type MiniGameId = (typeof MINI_GAME_IDS)[number];

/** Disposición del texto con huecos. */
export const GAP_LAYOUTS = ["sentence", "paragraph", "dialogue"] as const;

export type GapLayout = (typeof GAP_LAYOUTS)[number];

export interface ActivityOptionDto {
  id: string;
  label: string;
}

/** Trozo de texto o hueco dentro de un enunciado con huecos en línea. */
export type ActivitySegment =
  | { kind: "text"; value: string }
  | { kind: "gap"; gapId: string; position: number }
  | { kind: "break" }
  | { kind: "speaker"; label: string };

interface ActivityBaseDto {
  id: string;
  level: CefrLevel;
  taxonomyNodeId: string;
  /** Tipo pedagógico, para etiquetas y filtros. */
  type: ActivityType;
  /** Ejercicio de origen antes de la homogeneización. */
  skillFocus: string;
  /** Consigna de la actividad. Siempre presente. */
  instructions: string;
  /** Texto de apoyo sin huecos (pasaje de lectura, contexto). */
  context?: string;
}

export interface GapFillActivityDto extends ActivityBaseDto {
  presentation: "gap_fill";
  /** Pregunta o encabezado sobre el texto con huecos, si aporta algo. */
  question?: string;
  segments: ActivitySegment[];
  layout: GapLayout;
  gapIds: string[];
  /** UoE Part 3: raíz en mayúsculas de la que derivar. */
  cueWord?: string;
}

export interface KeyWordTransformationActivityDto extends ActivityBaseDto {
  presentation: "key_word_transformation";
  firstSentence: string;
  keyWord: string;
  segments: ActivitySegment[];
  gapIds: string[];
  /** Límite de palabras de UoE Part 4 (contracciones cuentan doble). */
  maxWords: number;
}

export interface ChoiceActivityDto extends ActivityBaseDto {
  presentation: "choice";
  question: string;
  options: ActivityOptionDto[];
  selection: "single" | "multiple";
}

export interface TrueFalseActivityDto extends ActivityBaseDto {
  presentation: "true_false";
  statement: string;
}

export interface SwipeDeckActivityDto extends ActivityBaseDto {
  presentation: "swipe_deck";
  cards: Array<{ id: string; statement: string }>;
}

export interface WordOrderActivityDto extends ActivityBaseDto {
  presentation: "word_order";
  /** Fragmentos ya barajados de forma determinista. */
  tokens: Array<{ id: string; text: string }>;
}

export interface MatchingActivityDto extends ActivityBaseDto {
  presentation: "matching";
  leftItems: ActivityOptionDto[];
  rightItems: ActivityOptionDto[];
}

export interface FreeTextActivityDto extends ActivityBaseDto {
  presentation: "free_text";
  prompt: string;
  /** Restricción de la tarea, si la hay ("usa la tercera condicional"). */
  constraintHint?: string;
}

export interface MiniGameRoundDto {
  id: string;
  prompt: string;
  options: ActivityOptionDto[];
}

export interface MiniGameActivityDto extends ActivityBaseDto {
  presentation: "mini_game";
  game: MiniGameId;
  /** Sin la opción correcta: la corrección vive solo en el servidor. */
  rounds: MiniGameRoundDto[];
}

/**
 * Unión discriminada por `presentation`. Nunca incluye la respuesta correcta:
 * la corrección vive únicamente en el servidor.
 */
export type ActivityQuestionDto =
  | GapFillActivityDto
  | KeyWordTransformationActivityDto
  | ChoiceActivityDto
  | TrueFalseActivityDto
  | SwipeDeckActivityDto
  | WordOrderActivityDto
  | MatchingActivityDto
  | FreeTextActivityDto
  | MiniGameActivityDto;

/** Tipos que se presentan con una familia dada. Sirve para filtrar el catálogo. */
export function activityTypesForPresentation(
  presentation: ActivityPresentation,
): ActivityType[] {
  return ACTIVITY_TYPES.filter((type) => PRESENTATION_BY_TYPE[type] === presentation);
}

/** Tabla única tipo -> presentación. */
export const PRESENTATION_BY_TYPE: Readonly<Record<ActivityType, ActivityPresentation>> = {
  gap_fill: "gap_fill",
  word_formation: "gap_fill",
  key_word_transformation: "key_word_transformation",
  single_choice: "choice",
  multiple_choice: "choice",
  true_false: "true_false",
  swipe_deck: "swipe_deck",
  word_order: "word_order",
  matching: "matching",
  error_correction: "free_text",
  guided_writing: "free_text",
  sentence_rewrite: "free_text",
  mini_game: "mini_game",
};
