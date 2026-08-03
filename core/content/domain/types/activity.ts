import type { CefrLevel } from "@/core/models/level";
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
  | { strategy: "unordered_set"; correctValues: string[]; normalization: NormalizationRules }
  | { strategy: "matching_pairs"; pairs: Array<{ leftId: string; rightId: string }> };

export interface ActivityOption {
  id: string;
  text: string;
  feedback?: string;
}

export interface ActivityPair {
  leftId: string;
  left: string;
  rightId: string;
  right: string;
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
  category: string;
  topic: string;
  subtopic: string;
  taxonomyNodeIds: string[];
  difficulty: number;
  instructions: string;
  prompt: string;
  passage?: string;
  options?: ActivityOption[];
  tokens?: ActivityOption[];
  pairs?: ActivityPair[];
  lessonIds: string[];
  tags: string[];
  estimatedSeconds: number;
  evaluator: Evaluator;
  explanation: string;
  status: ContentStatus;
}
