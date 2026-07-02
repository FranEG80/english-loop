import type { CefrLevel } from "./level";

export type LessonCategory =
  | "grammar"
  | "vocabulary"
  | "use_of_english"
  | "phrasal_verbs"
  | "collocations"
  | "prepositions"
  | "word_formation"
  | "writing"
  | "reading";

export type LessonStatus = "new" | "viewed" | "saved" | "mastered";

export interface LessonSummaryDto {
  id: string;
  level: CefrLevel;
  category: LessonCategory;
  taxonomyNodeId: string;
  /** Término gramatical/léxico en inglés, p. ej. "Future forms: will vs going to". */
  title: string;
  /** Resumen en español. */
  summary: string;
  tags: string[];
  difficulty: 1 | 2 | 3;
  status: LessonStatus;
}

export interface LessonExampleDto {
  english: string;
  translationEs: string;
}

export interface LessonDetailDto extends LessonSummaryDto {
  /** Explicación en español. */
  explanation: string;
  examples: LessonExampleDto[];
  /** Errores frecuentes, en español. */
  commonMistakes: string[];
  relatedActivityIds: string[];
}
