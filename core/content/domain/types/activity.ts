import type { CefrLevel } from "@/core/models/level";
import type { GapLayout, MiniGameId } from "@/core/models/types/activity";
import type { ContentStatus } from "../content-version";

/** Reglas de normalización de texto para evaluadores textuales. */
export interface NormalizationRules {
  trim: boolean;
  collapseWhitespace: boolean;
  caseSensitive: boolean;
  ignoreTerminalPunctuation: boolean;
  normaliseApostrophes: boolean;
}

/** Estrategias de evaluación deterministas soportadas. */
export type Evaluator =
  | { strategy: "boolean"; correct: boolean }
  | { strategy: "single_option"; correctOptionId: string }
  | { strategy: "multiple_options"; correctOptionIds: string[] }
  | { strategy: "exact_text"; answer: string; normalization: NormalizationRules }
  | { strategy: "one_of_texts"; answers: string[]; normalization: NormalizationRules }
  | {
      strategy: "per_gap";
      gaps: Array<{ gapId: string; answers: string[] }>;
      normalization: NormalizationRules;
    }
  | { strategy: "ordered_tokens"; correctTokenIds: string[] }
  | { strategy: "matching_pairs"; pairs: Array<{ leftId: string; rightId: string }> }
  | { strategy: "deck_booleans"; cards: Array<{ cardId: string; correct: boolean }> }
  | {
      strategy: "game_rounds";
      rounds: Array<{ roundId: string; correctOptionId: string }>;
    };

export type EvaluatorStrategy = Evaluator["strategy"];

export interface ActivityOption {
  id: string;
  text: string;
  /** Por qué este distractor es incorrecto. Lo muestra el resumen de errores. */
  feedback?: string;
}

export interface ActivityPair {
  leftId: string;
  left: string;
  rightId: string;
  right: string;
}

/** Carta de un `swipe_deck`. La respuesta correcta vive en el evaluador. */
export interface ActivityCard {
  id: string;
  statement: string;
  explanation: string;
}

/** Ronda de un `mini_game`. La respuesta correcta vive en el evaluador. */
export interface ActivityRound {
  id: string;
  prompt: string;
  options: ActivityOption[];
  explanation: string;
}

/**
 * Actividad de catálogo completa (lado servidor). Incluye el evaluador y la
 * explicación; NUNCA debe enviarse entera al cliente antes del intento.
 */
export interface Activity {
  id: string;
  /** Immutable catalog version used when the activity is attempted. */
  versionId?: string;
  level: CefrLevel;
  type: string;
  /** Ejercicio de origen antes de la homogeneización de tipos. */
  skillFocus: string;
  category: string;
  topic: string;
  subtopic: string;
  taxonomyNodeIds: string[];
  difficulty: number;
  instructions: string;
  prompt: string;
  /** Texto con marcadores `[gapN]`. Solo en tipos con huecos. */
  gapText?: string;
  gapLayout?: GapLayout;
  /** Contexto de lectura. Nunca contiene huecos. */
  passage?: string;
  /** UoE Part 3: raíz en mayúsculas de la que derivar. */
  cueWord?: string;
  /** UoE Part 4: palabra clave que debe aparecer sin modificar. */
  keyWord?: string;
  /** UoE Part 4: frase de partida. */
  firstSentence?: string;
  options?: ActivityOption[];
  /** El orden de `options` es significativo y no debe barajarse. */
  optionsOrdered?: boolean;
  tokens?: ActivityOption[];
  pairs?: ActivityPair[];
  cards?: ActivityCard[];
  game?: MiniGameId;
  rounds?: ActivityRound[];
  lessonIds: string[];
  tags: string[];
  estimatedSeconds: number;
  evaluator: Evaluator;
  explanation: string;
  status: ContentStatus;
}
