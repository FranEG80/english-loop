import type { ActivityCatalogPagePort, ActivityCatalogPort, ActivityListFilters, CatalogMetadata, CatalogMetadataPort, LessonCatalogPagePort, LessonCatalogPort, LessonListFilters, TaxonomyCatalogPort } from "@/core/content/ports/catalog-ports";
import type { Activity } from "@/core/content/domain/types/activity";
import type { Lesson } from "@/core/content/domain/types/lesson";
import type { TaxonomyNode } from "@/core/content/domain/types/taxonomy";
import type { D1TransportClient } from "./types/transport";
import { CONTENT_SCHEMA_VERSION, UNKNOWN_DATASET_VERSION } from "@/core/content/domain/content-version";
import { DatasetUnavailableException } from "@/core/shared/exceptions";
import { mapPrismaActivity, mapPrismaLesson, parseCatalogJson, type PrismaActivityVersionRow, type PrismaLessonVersionRow } from "@/adapters/content/prisma-catalog-mappers";
import { bool, first, nullableText, rows, text, type Row } from "./mappers/d1-row-mapper";
import { operation } from "./operations/request";
import { assertCursorPageLimit, decodeCursor, encodeCursor, type CursorPage, type CursorPaginationParams } from "@/core/shared/kernel";

export class D1CatalogAdapter implements LessonCatalogPort, LessonCatalogPagePort, ActivityCatalogPort, ActivityCatalogPagePort, TaxonomyCatalogPort, CatalogMetadataPort {
  constructor(private readonly transport: D1TransportClient) {}

  private async requireCatalog(): Promise<void> {
    const result = await this.transport.execute(operation({ name: "activeCatalogMetadata" }));
    if (!first(result)) throw new DatasetUnavailableException("No published catalog release is active", "Content catalog is unavailable.");
  }

  async listLessons(filters?: LessonListFilters): Promise<Lesson[]> {
    await this.requireCatalog();
    return rows(await this.transport.execute(operation({ name: "catalogLessons", level: filters?.level, category: filters?.category }))).map((row) => mapPrismaLesson({
      id: text(row.id), lessonId: text(row.lessonId), levelCode: text(row.levelCode), category: text(row.category), taxonomyNodeId: text(row.taxonomyNodeId), prerequisites: text(row.prerequisites), title: text(row.title), summary: text(row.summary), explanation: text(row.explanation), examples: text(row.examples), commonMistakes: text(row.commonMistakes), tags: text(row.tags), difficulty: Number(row.difficulty), contentVersion: Number(row.contentVersion), statusCode: text(row.statusCode),
    } satisfies PrismaLessonVersionRow, parseCatalogJson(text(row.relatedActivityIds), []))); 
  }

  async listLessonsPage(
    filters: LessonListFilters | undefined,
    pagination: CursorPaginationParams,
  ): Promise<CursorPage<Lesson>> {
    assertCursorPageLimit(pagination.limit);
    await this.requireCatalog();
    const cursor = pagination.cursor ? decodeCursor(pagination.cursor) : undefined;
    const result = await this.transport.execute(operation({
      name: "catalogLessons",
      level: filters?.level,
      category: filters?.category,
      cursor,
      limit: pagination.limit + 1,
    }));
    const mapped = rows(result).map((row) => mapPrismaLesson({
      id: text(row.id), lessonId: text(row.lessonId), levelCode: text(row.levelCode), category: text(row.category), taxonomyNodeId: text(row.taxonomyNodeId), prerequisites: text(row.prerequisites), title: text(row.title), summary: text(row.summary), explanation: text(row.explanation), examples: text(row.examples), commonMistakes: text(row.commonMistakes), tags: text(row.tags), difficulty: Number(row.difficulty), contentVersion: Number(row.contentVersion), statusCode: text(row.statusCode),
    } satisfies PrismaLessonVersionRow, parseCatalogJson(text(row.relatedActivityIds), [])));
    const hasMore = mapped.length > pagination.limit;
    const items = hasMore ? mapped.slice(0, pagination.limit) : mapped;
    return { items, hasMore, nextCursor: hasMore ? encodeCursor(items.at(-1)!.id) : null };
  }

  async getLessonById(lessonId: string): Promise<Lesson | null> {
    await this.requireCatalog();
    const result = await this.transport.execute(operation({ name: "catalogLessons" }));
    const row = rows(result).find((candidate) => candidate.lessonId === lessonId);
    return row ? mapPrismaLesson({ id: text(row.id), lessonId: text(row.lessonId), levelCode: text(row.levelCode), category: text(row.category), taxonomyNodeId: text(row.taxonomyNodeId), prerequisites: text(row.prerequisites), title: text(row.title), summary: text(row.summary), explanation: text(row.explanation), examples: text(row.examples), commonMistakes: text(row.commonMistakes), tags: text(row.tags), difficulty: Number(row.difficulty), contentVersion: Number(row.contentVersion), statusCode: text(row.statusCode) } satisfies PrismaLessonVersionRow, parseCatalogJson(text(row.relatedActivityIds), [])) : null;
  }

  async listActivities(filters?: ActivityListFilters): Promise<Activity[]> {
    await this.requireCatalog();
    const baseRows = rows(await this.transport.execute(operation({ name: "catalogActivities", taxonomyNodeId: filters?.taxonomyNodeId, level: filters?.level === "both" ? undefined : filters?.level, lessonIds: filters?.lessonIds })));
    return baseRows.map((row) => mapPrismaActivity({
      id: text(row.id), activityId: text(row.activityId), levelCode: text(row.levelCode), activityTypeCode: text(row.activityTypeCode), category: text(row.category), topic: text(row.topic), subtopic: text(row.subtopic), difficulty: Number(row.difficulty), instructions: text(row.instructions), prompt: text(row.prompt), passage: nullableText(row.passage), explanation: text(row.explanation), tags: text(row.tags), lessonIds: text(row.lessonIds), estimatedSeconds: Number(row.estimatedSeconds), evaluatorData: text(row.evaluatorData), statusCode: text(row.statusCode),
      options: parseCatalogJson(text(row.options), []), tokens: parseCatalogJson(text(row.tokens), []), pairs: parseCatalogJson(text(row.pairs), []), lessonLinks: parseCatalogJson(text(row.lessonLinks), []), taxonomyLinks: parseCatalogJson(text(row.taxonomyLinks), []),
      } satisfies PrismaActivityVersionRow));
  }

  async listActivitiesPage(
    filters: ActivityListFilters | undefined,
    pagination: CursorPaginationParams,
  ): Promise<CursorPage<Activity>> {
    assertCursorPageLimit(pagination.limit);
    await this.requireCatalog();
    const cursor = pagination.cursor ? decodeCursor(pagination.cursor) : undefined;
    const result = await this.transport.execute(operation({
      name: "catalogActivities",
      taxonomyNodeId: filters?.taxonomyNodeId,
      level: filters?.level === "both" ? undefined : filters?.level,
      lessonIds: filters?.lessonIds,
      cursor,
      limit: pagination.limit + 1,
    }));
    const mapped = rows(result).map((row) => mapPrismaActivity({
      id: text(row.id), activityId: text(row.activityId), levelCode: text(row.levelCode), activityTypeCode: text(row.activityTypeCode), category: text(row.category), topic: text(row.topic), subtopic: text(row.subtopic), difficulty: Number(row.difficulty), instructions: text(row.instructions), prompt: text(row.prompt), passage: nullableText(row.passage), explanation: text(row.explanation), tags: text(row.tags), lessonIds: text(row.lessonIds), estimatedSeconds: Number(row.estimatedSeconds), evaluatorData: text(row.evaluatorData), statusCode: text(row.statusCode),
      options: parseCatalogJson(text(row.options), []), tokens: parseCatalogJson(text(row.tokens), []), pairs: parseCatalogJson(text(row.pairs), []), lessonLinks: parseCatalogJson(text(row.lessonLinks), []), taxonomyLinks: parseCatalogJson(text(row.taxonomyLinks), []),
    } satisfies PrismaActivityVersionRow));
    const hasMore = mapped.length > pagination.limit;
    const items = hasMore ? mapped.slice(0, pagination.limit) : mapped;
    return { items, hasMore, nextCursor: hasMore ? encodeCursor(items.at(-1)!.id) : null };
  }

  async getActivityById(activityId: string): Promise<Activity | null> {
    await this.requireCatalog();
    const result = await this.transport.execute(operation({ name: "activityById", activityId }));
    const row = first<Row>(result);
    if (!row) return null;
    return mapPrismaActivity({
      id: text(row.id), activityId: text(row.activityId), levelCode: text(row.levelCode), activityTypeCode: text(row.activityTypeCode), category: text(row.category), topic: text(row.topic), subtopic: text(row.subtopic), difficulty: Number(row.difficulty), instructions: text(row.instructions), prompt: text(row.prompt), passage: nullableText(row.passage), explanation: text(row.explanation), tags: text(row.tags), lessonIds: text(row.lessonIds), estimatedSeconds: Number(row.estimatedSeconds), evaluatorData: text(row.evaluatorData), statusCode: text(row.statusCode), options: parseCatalogJson(text(row.options), []), tokens: parseCatalogJson(text(row.tokens), []), pairs: parseCatalogJson(text(row.pairs), []), lessonLinks: parseCatalogJson(text(row.lessonLinks), []), taxonomyLinks: parseCatalogJson(text(row.taxonomyLinks), []),
    });
  }

  async getActivityByVersionId(activityVersionId: string): Promise<Activity | null> {
    const result = await this.transport.execute(operation({ name: "activityByVersionId", activityVersionId }));
    const row = first<Row>(result);
    if (!row) return null;
    return mapPrismaActivity({
      id: text(row.id), activityId: text(row.activityId), levelCode: text(row.levelCode), activityTypeCode: text(row.activityTypeCode), category: text(row.category), topic: text(row.topic), subtopic: text(row.subtopic), difficulty: Number(row.difficulty), instructions: text(row.instructions), prompt: text(row.prompt), passage: nullableText(row.passage), explanation: text(row.explanation), tags: text(row.tags), lessonIds: text(row.lessonIds), estimatedSeconds: Number(row.estimatedSeconds), evaluatorData: text(row.evaluatorData), statusCode: text(row.statusCode), options: parseCatalogJson(text(row.options), []), tokens: parseCatalogJson(text(row.tokens), []), pairs: parseCatalogJson(text(row.pairs), []), lessonLinks: parseCatalogJson(text(row.lessonLinks), []), taxonomyLinks: parseCatalogJson(text(row.taxonomyLinks), []),
    });
  }

  async countActivitiesByNode(nodeId: string, level: "B1" | "B2" | "both"): Promise<number> {
    const activities = await this.listActivities({ taxonomyNodeId: nodeId, level });
    return activities.length;
  }

  async countActivitiesByNodes(nodeIds: string[], level: "B1" | "B2" | "both"): Promise<number> {
    if (nodeIds.length === 0) return 0;
    const activities = await this.listActivities({ level });
    return activities.filter((activity) => activity.taxonomyNodeIds.some((id) => nodeIds.includes(id))).length;
  }

  async getTaxonomyTree(): Promise<TaxonomyNode[]> {
    await this.requireCatalog();
    const flat = rows(await this.transport.execute(operation({ name: "catalogTaxonomy" }))).map((row) => ({ id: text(row.nodeId), parentId: nullableText(row.parentId), kind: text(row.kind) as TaxonomyNode["kind"], labels: { en: text(row.labelsEn), es: text(row.labelsEs) }, levels: parseCatalogJson(text(row.levels), []) as TaxonomyNode["levels"], selectableForPractice: bool(row.selectableForPractice), order: Number(row.sortOrder), children: [] as TaxonomyNode[] }));
    const byId = new Map(flat.map((node) => [node.id, node]));
    for (const node of flat) if (node.parentId) byId.get(node.parentId)?.children.push(node);
    return flat.filter((node) => node.parentId === null).sort((a, b) => a.order - b.order);
  }

  private async flatTaxonomy(): Promise<TaxonomyNode[]> {
    const flatten = (nodes: TaxonomyNode[]): TaxonomyNode[] => nodes.flatMap((node) => [node, ...flatten(node.children)]);
    return flatten(await this.getTaxonomyTree());
  }

  async resolveNodeWithDescendants(nodeId: string): Promise<TaxonomyNode[]> {
    const all = await this.flatTaxonomy();
    const target = all.find((node) => node.id === nodeId);
    if (!target) return [];
    const flatten = (nodes: TaxonomyNode[]): TaxonomyNode[] => nodes.flatMap((node) => [node, ...flatten(node.children)]);
    return [target, ...flatten(target.children)];
  }

  async getNodePath(nodeId: string): Promise<TaxonomyNode[]> {
    const all = await this.flatTaxonomy();
    const byId = new Map(all.map((node) => [node.id, node]));
    const result: TaxonomyNode[] = [];
    let current = byId.get(nodeId);
    while (current) { result.unshift(current); current = current.parentId ? byId.get(current.parentId) : undefined; }
    return result;
  }

  async getContentVersion(): Promise<{ datasetVersion: string; schemaVersion: string }> {
    const result = await this.transport.execute(operation({ name: "activeCatalogMetadata" }));
    const row = first<Row>(result);
    return { datasetVersion: row ? text(row.datasetVersion) : UNKNOWN_DATASET_VERSION, schemaVersion: CONTENT_SCHEMA_VERSION };
  }

  async getCatalogMetadata(): Promise<CatalogMetadata> {
    const version = await this.getContentVersion();
    const [lessons, activities, taxonomy] = await Promise.all([
      this.transport.execute(operation({ name: "catalogCounts", kind: "lessons" })),
      this.transport.execute(operation({ name: "catalogCounts", kind: "activities" })),
      this.transport.execute(operation({ name: "catalogCounts", kind: "taxonomy" })),
    ]);
    return { ...version, lessonCount: Number(first<Row>(lessons)?.count ?? 0), activityCount: Number(first<Row>(activities)?.count ?? 0), taxonomyNodeCount: Number(first<Row>(taxonomy)?.count ?? 0) };
  }
}
