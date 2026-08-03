import type { CefrLevel } from "@/core/models/level";
import type { ContentStatus } from "./content-version";

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

export interface LessonExample {
  english: string;
  translationEs: string;
}

/** Lección tal como se sirve al cliente (DTO de dominio). */
export interface Lesson {
  id: string;
  /** Immutable catalog version used for historical references. */
  versionId?: string;
  level: CefrLevel;
  category: LessonCategory;
  taxonomyNodeId: string;
  title: string;
  summary: string;
  explanation: string;
  examples: LessonExample[];
  commonMistakes: string[];
  relatedActivityIds: string[];
  tags: string[];
  difficulty: 1 | 2 | 3;
  status: ContentStatus;
  contentVersion: number;
}
