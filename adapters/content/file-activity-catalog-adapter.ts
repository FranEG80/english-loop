import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Activity } from "@/core/content/domain/types/activity";
import { PUBLISHED_CONTENT_STATUS } from "@/core/content/domain/content-version";
import type { ActivityListFilters, ActivityCatalogPort } from "@/core/content/ports/catalog-ports";
import type { ActivityCatalogPagePort, ActivityCatalogSearchPort } from "@/core/content/ports/catalog-ports";
import { paginateSortedItems, type CursorPage, type CursorPaginationParams, type NumberedPage, type NumberedPaginationParams } from "@/core/shared/kernel";
import type { CefrLevel } from "@/core/models/level";
import { DatasetUnavailableException } from "@/core/shared/exceptions";
import {
  assertNumberedPagination,
  matchesCatalogSearch,
  numberedPage,
} from "@/core/content/domain/catalog-search";

interface ActivityIndexEntry {
  id: string;
  batchId: string;
  path: string;
  level: string;
  type: string;
  category: string;
  topic: string;
  subtopic: string;
  taxonomyNodeIds: string[];
  lessonIds: string[];
  difficulty: number;
  estimatedSeconds: number;
  status: string;
}

interface ActivityIndex {
  schemaVersion: string;
  generatedFromDatasetVersion: string;
  activities: ActivityIndexEntry[];
}

interface ActivityBatch {
  schemaVersion: string;
  batchId: string;
  activities: Activity[];
}

/**
 * Adaptador de actividades que lee `DATASET/catalog/activity-index.json` y
 * carga los batches bajo demanda. Cachea los batches ya leídos.
 */
export class FileActivityCatalogAdapter implements ActivityCatalogPort, ActivityCatalogPagePort, ActivityCatalogSearchPort {
  private readonly datasetRoot: string;
  private readonly indexPath: string;
  private indexPromise: Promise<ActivityIndexEntry[]> | null = null;
  private readonly batchCache = new Map<string, Promise<Activity[]>>();

  constructor(datasetRoot: string) {
    this.datasetRoot = datasetRoot;
    this.indexPath = path.join(datasetRoot, "catalog", "activity-index.json");
  }

  private async loadIndex(): Promise<ActivityIndexEntry[]> {
    if (this.indexPromise) return this.indexPromise;
    this.indexPromise = this.readIndex();
    return this.indexPromise;
  }

  private async readIndex(): Promise<ActivityIndexEntry[]> {
    let raw: ActivityIndex;
    try {
      raw = JSON.parse(await readFile(this.indexPath, "utf8")) as ActivityIndex;
    } catch {
      throw new DatasetUnavailableException(
        `Unable to read activity index at ${this.indexPath}`,
        "Content catalog is unavailable.",
        { path: this.indexPath },
      );
    }
    return raw.activities.filter(
      (activity) => activity.status === PUBLISHED_CONTENT_STATUS,
    );
  }

  private loadBatch(batchId: string, batchPath: string): Promise<Activity[]> {
    const cached = this.batchCache.get(batchId);
    if (cached) return cached;
    const promise = this.readBatch(batchPath);
    this.batchCache.set(batchId, promise);
    return promise;
  }

  private async readBatch(batchPath: string): Promise<Activity[]> {
    const filePath = path.join(this.datasetRoot, batchPath);
    let raw: ActivityBatch;
    try {
      raw = JSON.parse(await readFile(filePath, "utf8")) as ActivityBatch;
    } catch {
      throw new DatasetUnavailableException(
        `Unable to read activity batch at ${filePath}`,
        "Content catalog is unavailable.",
        { path: filePath },
      );
    }
    return raw.activities.filter(
      (activity) => activity.status === PUBLISHED_CONTENT_STATUS,
    );
  }

  private matchesFilters(
    entry: ActivityIndexEntry,
    filters?: ActivityListFilters,
  ): boolean {
    if (filters?.level && filters.level !== "both" && entry.level !== filters.level) return false;
    const taxonomyNodeIds = filters?.taxonomyNodeIds ??
      (filters?.taxonomyNodeId ? [filters.taxonomyNodeId] : []);
    if (
      taxonomyNodeIds.length > 0 &&
      !entry.taxonomyNodeIds.some((nodeId) => taxonomyNodeIds.includes(nodeId))
    ) return false;
    if (filters?.lessonIds && !entry.lessonIds.some((lessonId) => filters.lessonIds?.includes(lessonId))) return false;
    if (filters?.activityType && entry.type !== filters.activityType) return false;
    if (filters?.interactionMode) {
      const interactionMode = entry.type === "matching"
        ? "matching_pairs"
        : entry.type === "word_order"
          ? "sentence_builder"
          : "standard";
      if (interactionMode !== filters.interactionMode) return false;
    }
    return matchesCatalogSearch(
      [
        entry.id,
        entry.type,
        entry.category,
        entry.topic,
        entry.subtopic,
        ...entry.taxonomyNodeIds,
      ],
      filters?.query,
    );
  }

  async listActivities(filters?: ActivityListFilters): Promise<Activity[]> {
    const entries = await this.loadIndex();
    const filtered = entries.filter((entry) => this.matchesFilters(entry, filters));

    const byBatch = new Map<string, ActivityIndexEntry[]>();
    for (const entry of filtered) {
      const list = byBatch.get(entry.batchId) ?? [];
      list.push(entry);
      byBatch.set(entry.batchId, list);
    }

    const result: Activity[] = [];
    for (const [batchId, batchEntries] of byBatch) {
      const activities = await this.loadBatch(batchId, batchEntries[0].path);
      const wanted = new Set(batchEntries.map((entry) => entry.id));
      result.push(...activities.filter((activity) => wanted.has(activity.id)));
    }
    return result;
  }

  async listActivitiesPage(
    filters: ActivityListFilters | undefined,
    pagination: CursorPaginationParams,
  ): Promise<CursorPage<Activity>> {
    const entries = await this.loadIndex();
    const filtered = entries
      .filter((entry) => this.matchesFilters(entry, filters))
      .sort((left, right) => left.id.localeCompare(right.id));
    const page = paginateSortedItems(filtered, pagination, (entry) => entry.id);
    const byBatch = new Map<string, ActivityIndexEntry[]>();
    for (const entry of page.items) {
      const list = byBatch.get(entry.batchId) ?? [];
      list.push(entry);
      byBatch.set(entry.batchId, list);
    }
    const activitiesById = new Map<string, Activity>();
    for (const [batchId, batchEntries] of byBatch) {
      const activities = await this.loadBatch(batchId, batchEntries[0].path);
      const wanted = new Set(batchEntries.map((entry) => entry.id));
      for (const activity of activities) {
        if (wanted.has(activity.id)) activitiesById.set(activity.id, activity);
      }
    }
    return { ...page, items: page.items.flatMap((entry) => activitiesById.get(entry.id) ?? []) };
  }

  async searchActivitiesPage(
    filters: ActivityListFilters | undefined,
    pagination: NumberedPaginationParams,
  ): Promise<NumberedPage<Activity>> {
    assertNumberedPagination(pagination.page, pagination.pageSize);
    const entries = (await this.loadIndex())
      .filter((entry) => this.matchesFilters(entry, filters))
      .sort((left, right) => left.id.localeCompare(right.id));
    const start = (pagination.page - 1) * pagination.pageSize;
    const pageEntries = entries.slice(start, start + pagination.pageSize);
    const byBatch = new Map<string, ActivityIndexEntry[]>();
    for (const entry of pageEntries) {
      const list = byBatch.get(entry.batchId) ?? [];
      list.push(entry);
      byBatch.set(entry.batchId, list);
    }
    const activitiesById = new Map<string, Activity>();
    for (const [batchId, batchEntries] of byBatch) {
      const activities = await this.loadBatch(batchId, batchEntries[0].path);
      const wanted = new Set(batchEntries.map((entry) => entry.id));
      for (const activity of activities) {
        if (wanted.has(activity.id)) activitiesById.set(activity.id, activity);
      }
    }
    return numberedPage(
      pageEntries.flatMap((entry) => activitiesById.get(entry.id) ?? []),
      entries.length,
      pagination.page,
      pagination.pageSize,
    );
  }

  async getActivityById(activityId: string): Promise<Activity | null> {
    const entries = await this.loadIndex();
    const entry = entries.find((activity) => activity.id === activityId);
    if (!entry) return null;
    const activities = await this.loadBatch(entry.batchId, entry.path);
    return activities.find((activity) => activity.id === activityId) ?? null;
  }

  async getActivityByVersionId(activityVersionId: string): Promise<Activity | null> {
    const entries = await this.loadIndex();
    for (const entry of entries) {
      const activities = await this.loadBatch(entry.batchId, entry.path);
      const activity = activities.find((candidate) => candidate.versionId === activityVersionId);
      if (activity) return activity;
    }
    return null;
  }

  async countActivitiesByNode(nodeId: string, level: CefrLevel | "both"): Promise<number> {
    return this.countActivitiesByNodes([nodeId], level);
  }

  async countActivitiesByNodes(nodeIds: string[], level: CefrLevel | "both"): Promise<number> {
    const entries = await this.loadIndex();
    const nodeSet = new Set(nodeIds);
    return entries.filter(
      (entry) =>
        (level === "both" || entry.level === level) &&
        entry.taxonomyNodeIds.some((nodeId) => nodeSet.has(nodeId)),
    ).length;
  }
}
