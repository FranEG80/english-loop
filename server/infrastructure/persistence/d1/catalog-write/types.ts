import type { CatalogSeedInput, CatalogSeedResult } from "@/core/content/ports/catalog-write-port";
import type { CatalogSeedActivity, CatalogSeedLesson, CatalogSeedTaxonomyNode } from "@/core/content/ports/catalog-write-port";
import type { D1DatabaseLike } from "../types/binding";

export interface D1CatalogWriteOptions {
  dryRun?: boolean;
}

export interface D1CatalogReleaseRow {
  id: string;
  status: string;
}

export interface D1CatalogSeedSession {
  releaseId: string;
  importId: string;
  status: "started" | "unchanged";
  result?: CatalogSeedResult;
}

export type D1CatalogSeedChunk =
  | { kind: "references"; releaseId: string; activityTypes: string[]; evaluatorStrategies: string[]; levels: string[]; statuses: string[] }
  | { kind: "taxonomy"; releaseId: string; nodes: CatalogSeedTaxonomyNode[] }
  | { kind: "lessons"; releaseId: string; lessons: CatalogSeedLesson[] }
  | { kind: "activities"; releaseId: string; activities: CatalogSeedActivity[] };

export type { CatalogSeedInput, CatalogSeedResult, D1DatabaseLike };
