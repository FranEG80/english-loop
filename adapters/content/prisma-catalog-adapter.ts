import "server-only";
import type { PrismaClient, Prisma } from "@/generated/prisma/client";
import type { Activity } from "@/core/content/domain/activity";
import {
  ACTIVE_CATALOG_PUBLICATION_ID,
  CONTENT_SCHEMA_VERSION,
  PUBLISHED_CONTENT_STATUS,
  UNKNOWN_DATASET_VERSION,
  type ContentVersion,
} from "@/core/content/domain/content-version";
import type { Lesson } from "@/core/content/domain/lesson";
import type { TaxonomyNode } from "@/core/content/domain/taxonomy";
import type {
  ActivityCatalogPort,
  ActivityListFilters,
  CatalogMetadata,
  CatalogMetadataPort,
  LessonCatalogPort,
  LessonListFilters,
  TaxonomyCatalogPort,
} from "@/core/content/ports/catalog-ports";
import type { CefrLevel } from "@/core/models/level";
import { DatasetUnavailableException } from "@/core/shared/exceptions";
import { getPrismaClient } from "@/server/infrastructure/database/prisma-transaction-context";
import { mapPrismaActivity, mapPrismaLesson, parseCatalogJson } from "./prisma-catalog-mappers";

/**
 * Read adapter for the normalized published catalog. It only follows the
 * active publication pointer, so an in-progress or failed seed is invisible.
 */
export class PrismaCatalogAdapter
  implements LessonCatalogPort, ActivityCatalogPort, TaxonomyCatalogPort, CatalogMetadataPort
{
  constructor(private readonly client: PrismaClient) {}

  private db() {
    return getPrismaClient(this.client);
  }

  private async activeReleaseId(): Promise<string | null> {
    const publication = await this.db().catalogPublication.findUnique({
      where: { id: ACTIVE_CATALOG_PUBLICATION_ID },
      select: { releaseId: true, release: { select: { status: true } } },
    });
    return publication?.release.status === PUBLISHED_CONTENT_STATUS ? publication.releaseId : null;
  }

  private async requireActiveReleaseId(): Promise<string> {
    const releaseId = await this.activeReleaseId();
    if (!releaseId) {
      throw new DatasetUnavailableException(
        "No published catalog release is active",
        "Content catalog is unavailable.",
      );
    }
    return releaseId;
  }

  private async relatedActivitiesByLesson(releaseId: string): Promise<Map<string, string[]>> {
    const rows = await this.db().activityVersion.findMany({
      where: { releaseId, statusCode: PUBLISHED_CONTENT_STATUS },
      select: {
        activityId: true,
        lessonLinks: { select: { lessonId: true, position: true }, orderBy: { position: "asc" } },
      },
    });
    const related = new Map<string, string[]>();
    for (const row of rows) {
      for (const link of row.lessonLinks) {
        const ids = related.get(link.lessonId) ?? [];
        ids.push(row.activityId);
        related.set(link.lessonId, ids);
      }
    }
    return related;
  }

  async listLessons(filters?: LessonListFilters): Promise<Lesson[]> {
    const releaseId = await this.requireActiveReleaseId();
    const where: Prisma.LessonVersionWhereInput = {
      releaseId,
      statusCode: PUBLISHED_CONTENT_STATUS,
      ...(filters?.level ? { levelCode: filters.level } : {}),
      ...(filters?.category ? { category: filters.category } : {}),
    };
    const [rows, related] = await Promise.all([
      this.db().lessonVersion.findMany({ where, orderBy: { lessonId: "asc" } }),
      this.relatedActivitiesByLesson(releaseId),
    ]);
    return rows.map((row) => mapPrismaLesson(row, related.get(row.lessonId) ?? []));
  }

  async getLessonById(lessonId: string): Promise<Lesson | null> {
    const releaseId = await this.requireActiveReleaseId();
    const [row, related] = await Promise.all([
      this.db().lessonVersion.findFirst({
        where: { releaseId, lessonId, statusCode: PUBLISHED_CONTENT_STATUS },
        orderBy: { id: "desc" },
      }),
      this.relatedActivitiesByLesson(releaseId),
    ]);
    return row ? mapPrismaLesson(row, related.get(lessonId) ?? []) : null;
  }

  private activityWhere(
    releaseId: string,
    filters?: ActivityListFilters,
  ): Prisma.ActivityVersionWhereInput {
    return {
      releaseId,
      statusCode: PUBLISHED_CONTENT_STATUS,
      ...(filters?.level && filters.level !== "both" ? { levelCode: filters.level } : {}),
      ...(filters?.taxonomyNodeId
        ? { taxonomyLinks: { some: { taxonomyNodeId: filters.taxonomyNodeId } } }
        : {}),
      ...(filters?.lessonIds && filters.lessonIds.length > 0
        ? { lessonLinks: { some: { lessonId: { in: filters.lessonIds } } } }
        : {}),
    };
  }

  private readonly activityInclude = {
    options: { orderBy: { position: "asc" as const } },
    tokens: { orderBy: { position: "asc" as const } },
    pairs: { orderBy: { position: "asc" as const } },
    lessonLinks: { orderBy: { position: "asc" as const } },
    taxonomyLinks: { orderBy: { position: "asc" as const } },
  } satisfies Prisma.ActivityVersionInclude;

  async listActivities(filters?: ActivityListFilters): Promise<Activity[]> {
    const releaseId = await this.requireActiveReleaseId();
    const rows = await this.db().activityVersion.findMany({
      where: this.activityWhere(releaseId, filters),
      include: this.activityInclude,
      orderBy: { activityId: "asc" },
    });
    return rows.map((row) => mapPrismaActivity(row));
  }

  async getActivityById(activityId: string): Promise<Activity | null> {
    const releaseId = await this.requireActiveReleaseId();
    const row = await this.db().activityVersion.findFirst({
      where: { releaseId, activityId, statusCode: PUBLISHED_CONTENT_STATUS },
      include: this.activityInclude,
      orderBy: { id: "desc" },
    });
    return row ? mapPrismaActivity(row) : null;
  }

  async countActivitiesByNode(nodeId: string, level: CefrLevel | "both"): Promise<number> {
    const releaseId = await this.requireActiveReleaseId();
    return this.db().activityVersion.count({
      where: {
        releaseId,
      statusCode: PUBLISHED_CONTENT_STATUS,
        ...(level !== "both" ? { levelCode: level } : {}),
        taxonomyLinks: { some: { taxonomyNodeId: nodeId } },
      },
    });
  }

  async countActivitiesByNodes(nodeIds: string[], level: CefrLevel | "both"): Promise<number> {
    if (nodeIds.length === 0) return 0;
    const releaseId = await this.requireActiveReleaseId();
    return this.db().activityVersion.count({
      where: {
        releaseId,
        statusCode: PUBLISHED_CONTENT_STATUS,
        ...(level !== "both" ? { levelCode: level } : {}),
        taxonomyLinks: { some: { taxonomyNodeId: { in: nodeIds } } },
      },
    });
  }

  private async activeTaxonomyVersions() {
    const releaseId = await this.requireActiveReleaseId();
    return this.db().taxonomyNodeVersion.findMany({
      where: { releaseId },
      orderBy: [{ parentId: "asc" }, { sortOrder: "asc" }],
    });
  }

  async getTaxonomyTree(): Promise<TaxonomyNode[]> {
    const rows = await this.activeTaxonomyVersions();
    const children = new Map<string, typeof rows>();
    for (const row of rows) {
      if (!row.parentId) continue;
      const list = children.get(row.parentId) ?? [];
      list.push(row);
      children.set(row.parentId, list);
    }
    const toDomain = (row: (typeof rows)[number]): TaxonomyNode => ({
      id: row.nodeId,
      parentId: row.parentId,
      kind: row.kind as TaxonomyNode["kind"],
      labels: { en: row.labelsEn, es: row.labelsEs },
      levels: parseCatalogJson(row.levels, []) as TaxonomyNode["levels"],
      selectableForPractice: row.selectableForPractice,
      order: row.sortOrder,
      children: (children.get(row.nodeId) ?? [])
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(toDomain),
    });
    return rows.filter((row) => row.parentId === null).sort((a, b) => a.sortOrder - b.sortOrder).map(toDomain);
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
    const target = byId.get(nodeId);
    if (!target) return [];
    const result: TaxonomyNode[] = [];
    let current: TaxonomyNode | undefined = target;
    while (current) {
      result.unshift(current);
      current = current.parentId ? byId.get(current.parentId) : undefined;
    }
    return result;
  }

  async getContentVersion(): Promise<ContentVersion> {
    const releaseId = await this.activeReleaseId();
    const release = releaseId
      ? await this.db().catalogRelease.findUnique({
          where: { id: releaseId },
          select: { datasetVersion: true },
        })
      : null;
    return {
      datasetVersion: release?.datasetVersion ?? UNKNOWN_DATASET_VERSION,
      schemaVersion: CONTENT_SCHEMA_VERSION,
    };
  }

  async getCatalogMetadata(): Promise<CatalogMetadata> {
    const releaseId = await this.activeReleaseId();
    if (!releaseId) {
      return { datasetVersion: UNKNOWN_DATASET_VERSION, schemaVersion: CONTENT_SCHEMA_VERSION, lessonCount: 0, activityCount: 0, taxonomyNodeCount: 0 };
    }
    const [release, lessonCount, activityCount, taxonomyNodeCount] = await Promise.all([
      this.db().catalogRelease.findUnique({ where: { id: releaseId }, select: { datasetVersion: true } }),
      this.db().lessonVersion.count({ where: { releaseId, statusCode: PUBLISHED_CONTENT_STATUS } }),
      this.db().activityVersion.count({ where: { releaseId, statusCode: PUBLISHED_CONTENT_STATUS } }),
      this.db().taxonomyNodeVersion.count({ where: { releaseId } }),
    ]);
    return {
      datasetVersion: release?.datasetVersion ?? UNKNOWN_DATASET_VERSION,
      schemaVersion: CONTENT_SCHEMA_VERSION,
      lessonCount,
      activityCount,
      taxonomyNodeCount,
    };
  }
}
