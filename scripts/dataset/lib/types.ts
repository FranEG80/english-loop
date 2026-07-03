export type Level = "B1" | "B2";
export type Status = "draft" | "reviewed" | "published";

export type ActivityType =
  | "true_false"
  | "single_choice"
  | "multiple_select"
  | "fill_blank"
  | "multi_gap_fill"
  | "multiple_choice_cloze"
  | "open_cloze"
  | "word_formation"
  | "matching"
  | "word_order"
  | "sentence_transformation"
  | "key_word_transformation"
  | "error_identification"
  | "error_correction"
  | "complete_dialogue"
  | "complete_paragraph"
  | "vocabulary_in_context"
  | "phrasal_verb_choice"
  | "collocation_choice"
  | "preposition_choice"
  | "reading_comprehension"
  | "reading_matching"
  | "gapped_text"
  | "guided_writing";

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
      strategy: "unordered_set";
      correctValues: string[];
      normalization: NormalizationRules;
    }
  | {
      strategy: "matching_pairs";
      pairs: Array<{ leftId: string; rightId: string }>;
    };

export interface ActivityOption {
  id: string;
  text: string;
  feedback?: string;
}

export interface Activity {
  schemaVersion: "1.0.0";
  id: string;
  status: Status;
  autoGradable: true;
  level: Level;
  type: ActivityType;
  category: string;
  topic: string;
  subtopic: string;
  taxonomyNodeIds: string[];
  difficulty: 1 | 2 | 3 | 4 | 5;
  instructions: string;
  prompt: string;
  passage?: string;
  options?: ActivityOption[];
  tokens?: ActivityOption[];
  pairs?: Array<{
    leftId: string;
    left: string;
    rightId: string;
    right: string;
  }>;
  lessonIds: string[];
  tags: string[];
  estimatedSeconds: number;
  evaluator: Evaluator;
  explanation: string;
}

export interface ActivityBatch {
  schemaVersion: "1.0.0";
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
