import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { CatalogMetadata, CatalogMetadataPort } from "@/core/content/ports/catalog-ports";
import { DatasetUnavailableException } from "@/core/shared/exceptions";

interface CountedIndex { generatedFromDatasetVersion: string; schemaVersion: string; lessons?: unknown[]; activities?: unknown[]; }
interface TaxonomyIndex { schemaVersion: string; nodes: unknown[] }

export class FileCatalogMetadataAdapter implements CatalogMetadataPort {
  private metadataPromise: Promise<CatalogMetadata> | null = null;

  constructor(private readonly datasetRoot: string) {}

  async getCatalogMetadata(): Promise<CatalogMetadata> {
    if (!this.metadataPromise) this.metadataPromise = this.readMetadata();
    return this.metadataPromise;
  }

  private async readMetadata(): Promise<CatalogMetadata> {
    try {
      const [lessons, activities, taxonomy] = await Promise.all([
        this.readJson<CountedIndex>("catalog/lesson-index.json"),
        this.readJson<CountedIndex>("catalog/activity-index.json"),
        this.readJson<TaxonomyIndex>("catalog/taxonomy.json"),
      ]);
      return {
        datasetVersion: lessons.generatedFromDatasetVersion,
        schemaVersion: lessons.schemaVersion,
        lessonCount: lessons.lessons?.length ?? 0,
        activityCount: activities.activities?.length ?? 0,
        taxonomyNodeCount: taxonomy.nodes.length,
      };
    } catch (error) {
      if (error instanceof DatasetUnavailableException) throw error;
      throw new DatasetUnavailableException(
        "Unable to read catalog metadata",
        "Content catalog is unavailable.",
      );
    }
  }

  private async readJson<T>(relativePath: string): Promise<T> {
    const filePath = path.join(this.datasetRoot, relativePath);
    try {
      return JSON.parse(await readFile(filePath, "utf8")) as T;
    } catch {
      throw new DatasetUnavailableException(
        `Unable to read catalog index at ${filePath}`,
        "Content catalog is unavailable.",
        { path: filePath },
      );
    }
  }
}
