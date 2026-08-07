export type Level = "B1" | "B2";
export type Status = "draft" | "reviewed" | "published";

/**
 * Tipos canónicos del catálogo (schema v2). Coinciden 1:1 con
 * `core/models/types/activity.ts`; no hay traducción entre vocabularios.
 * El ejercicio original de cada item se conserva en `skillFocus`.
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

export const MINI_GAME_IDS = [
  "frog_leap",
  "lane_runner",
  "sentence_tower",
] as const;

export type MiniGameId = (typeof MINI_GAME_IDS)[number];

/** Cómo se dispone el texto con huecos de un `gap_fill`. */
export const GAP_LAYOUTS = ["sentence", "paragraph", "dialogue"] as const;

export type GapLayout = (typeof GAP_LAYOUTS)[number];

export interface NormalizationRules {
  trim: boolean;
  collapseWhitespace: boolean;
  caseSensitive: boolean;
  ignoreTerminalPunctuation: boolean;
  normaliseApostrophes: boolean;
}

export type Evaluator =
  | { strategy: "boolean"; correct: boolean }
  | { strategy: "single_option"; correctOptionId: string }
  | { strategy: "multiple_options"; correctOptionIds: string[] }
  | {
      strategy: "exact_text";
      answer: string;
      normalization: NormalizationRules;
    }
  | {
      strategy: "one_of_texts";
      answers: string[];
      normalization: NormalizationRules;
    }
  | {
      strategy: "per_gap";
      gaps: Array<{ gapId: string; answers: string[] }>;
      normalization: NormalizationRules;
    }
  | { strategy: "ordered_tokens"; correctTokenIds: string[] }
  | {
      strategy: "matching_pairs";
      pairs: Array<{ leftId: string; rightId: string }>;
    }
  | {
      strategy: "deck_booleans";
      cards: Array<{ cardId: string; correct: boolean }>;
    }
  | {
      strategy: "game_rounds";
      rounds: Array<{ roundId: string; correctOptionId: string }>;
    };

export type EvaluatorStrategy = Evaluator["strategy"];

export interface ActivityOption {
  id: string;
  text: string;
  /** Por qué este distractor está mal. Lo consume el resumen de errores. */
  feedback?: string;
}

export interface ActivityPair {
  leftId: string;
  left: string;
  rightId: string;
  right: string;
}

/** Una carta de un `swipe_deck`. La respuesta correcta vive en el evaluador. */
export interface ActivityCard {
  id: string;
  statement: string;
  explanation: string;
}

/** Una ronda de un `mini_game`. La respuesta correcta vive en el evaluador. */
export interface ActivityRound {
  id: string;
  prompt: string;
  options: ActivityOption[];
  explanation: string;
}

export interface Activity {
  schemaVersion: "2.0.0";
  id: string;
  status: Status;
  autoGradable: true;
  level: Level;
  type: ActivityType;
  /** Ejercicio original antes de la homogeneización (p. ej. "open_cloze"). */
  skillFocus: string;
  category: string;
  topic: string;
  subtopic: string;
  taxonomyNodeIds: string[];
  difficulty: 1 | 2 | 3 | 4 | 5;
  instructions: string;
  prompt: string;
  /** Texto que contiene los huecos `[gapN]`. Solo en tipos con huecos. */
  gapText?: string;
  /** Disposición del `gapText`. Solo en `gap_fill`. */
  gapLayout?: GapLayout;
  /** Contexto de lectura. NUNCA contiene huecos. */
  passage?: string;
  /** UoE Part 3: la raíz en mayúsculas de la que derivar. */
  cueWord?: string;
  /** UoE Part 4: la palabra clave que debe aparecer sin modificar. */
  keyWord?: string;
  /** UoE Part 4: la frase de partida. */
  firstSentence?: string;
  options?: ActivityOption[];
  /**
   * El orden de `options` es significativo y no debe barajarse: opciones de
   * cierre («all of the above»), escalas numéricas o secuencias ordinales.
   * Lo respetan tanto el codemod como el renderer.
   */
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
}

export interface ActivityBatch {
  schemaVersion: "2.0.0";
  batchId: string;
  level: Level;
  category: string;
  topic: string;
  subtopic: string;
  lessonId: string;
  activityType: ActivityType;
  activities: Activity[];
}

export interface LessonFrontmatter {
  schemaVersion: "1.0.0";
  id: string;
  title: string;
  level: Level;
  category: string;
  topic: string;
  subtopics: string[];
  difficulty: 1 | 2 | 3 | 4 | 5;
  estimatedMinutes: number;
  learningObjectives: string[];
  prerequisites: string[];
  frameworkRefs: string[];
  relatedLessonIds: string[];
  tags: string[];
  status: Status;
  author: string;
  reviewer: string;
  contentVersion: number;
}

export interface LessonDocument {
  filePath: string;
  relativePath: string;
  frontmatter: LessonFrontmatter;
  content: string;
}

export interface TaxonomyNode {
  id: string;
  parentId: string | null;
  kind: "category" | "topic" | "subtopic" | "skill";
  labels: { en: string; es: string };
  levels: Level[];
  selectableForPractice: boolean;
  order: number;
}

export interface Taxonomy {
  schemaVersion: "1.0.0";
  nodes: TaxonomyNode[];
}

export interface CoverageTargets {
  schemaVersion: "1.0.0";
  global: {
    minimumLessons: number;
    minimumActivities: number;
  };
  nodes: Array<{
    taxonomyNodeId: string;
    level: Level;
    minimumActivities: number;
    minimumActivityTypes: number;
    requiredDifficulties: number[];
  }>;
}

export interface CurriculumUnit {
  id: string;
  level: Level;
  category: string;
  topic: string;
  subtopic: string;
  skills: string[];
  learningObjectives: string[];
  prerequisites: string[];
  frameworkRefs: string[];
  compatibleActivityTypes: ActivityType[];
  plannedLessonIds: string[];
}

export interface CurriculumMap {
  schemaVersion: "1.0.0";
  auditNotes: string[];
  units: CurriculumUnit[];
}

export interface SourcesCatalog {
  schemaVersion: "1.0.0";
  consultedAt: string;
  sources: Array<{
    id: string;
    organisation: string;
    title: string;
    url: string;
    consultedAt: string;
    permittedUse: string;
    notes: string;
  }>;
}

export interface LoadedDataset {
  lessons: LessonDocument[];
  batches: Array<{ filePath: string; relativePath: string; batch: ActivityBatch }>;
  activities: Activity[];
  taxonomy: Taxonomy;
  coverageTargets: CoverageTargets;
  curriculumMap: CurriculumMap;
  sources: SourcesCatalog;
}

export type ActivityResponse =
  | boolean
  | string
  | string[]
  | Record<string, string>;
