import type { Evaluator, ActivityOption, ActivityPair } from "../domain/activity";
import type { LessonExample } from "../domain/lesson";

export interface CatalogSeedTaxonomyNode {
  id: string;
  checksum: string;
  parentId: string | null;
  kind: string;
  labels: { en: string; es: string };
  levels: string[];
  selectableForPractice: boolean;
  order: number;
}

export interface CatalogSeedLesson {
  id: string;
  checksum: string;
  level: string;
  category: string;
  taxonomyNodeId: string;
  title: string;
  summary: string;
  explanation: string;
  examples: LessonExample[];
  commonMistakes: string[];
  tags: string[];
  difficulty: number;
  contentVersion: number;
  status: string;
}

export interface CatalogSeedActivity {
  id: string;
  checksum: string;
  type: string;
  evaluatorStrategy: string;
  level: string;
  category: string;
  topic: string;
  subtopic: string;
  difficulty: number;
  instructions: string;
  prompt: string;
  passage?: string;
  explanation: string;
  tags: string[];
  lessonIds: string[];
  taxonomyNodeIds: string[];
  estimatedSeconds: number;
  evaluator: Evaluator;
  options: ActivityOption[];
  tokens: ActivityOption[];
  pairs: ActivityPair[];
  expectedAnswers: Array<{ gapId: string | null; answer: string; position: number }>;
  status: string;
}

export interface CatalogSeedInput {
  datasetVersion: string;
  checksum: string;
  taxonomy: CatalogSeedTaxonomyNode[];
  lessons: CatalogSeedLesson[];
  activities: CatalogSeedActivity[];
}

export interface CatalogSeedResult {
  releaseId: string | null;
  datasetVersion: string;
  checksum: string;
  status: "dry_run" | "published" | "unchanged";
  counts: {
    taxonomy: number;
    lessons: number;
    activities: number;
  };
}

/**
 * Write-side port for editorial catalog releases. Implementations must make
 * publication observable only after every version and relationship is valid.
 */
export interface CatalogWritePort {
  seedCatalog(input: CatalogSeedInput, options?: { dryRun?: boolean }): Promise<CatalogSeedResult>;
}
