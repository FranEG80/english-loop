import "server-only";
import type { PrismaClient, Prisma } from "@/generated/prisma/client";
import type { Activity } from "@/core/content/domain/activity";
import type { ContentVersion } from "@/core/content/domain/content-version";
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

const ACTIVE_PUBLICATION_ID = "active";

function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function levelMatches(level: string, requested: CefrLevel | "both" | undefined): boolean {
  return !requested || requested === "both" || level === requested;
}

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
      where: { id: ACTIVE_PUBLICATION_ID },
    });
    return publication?.releaseId ?? null;
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
      where: { releaseId, statusCode: "published" },
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

  private mapLesson(
    row: {
      id: string;
      lessonId: string;
      levelCode: string;
      category: string;
      taxonomyNodeId: string;
      title: string;
      summary: string;
      explanation: string;
      examples: string;
      commonMistakes: string;
      tags: string;
      difficulty: number;
      statusCode: string;
      contentVersion: number;
    },
    relatedActivityIds: string[],
  ): Lesson {
    return {
      id: row.lessonId,
      versionId: row.id,
      level: row.levelCode as Lesson["level"],
      category: row.category as Lesson["category"],
      taxonomyNodeId: row.taxonomyNodeId,
      title: row.title,
      summary: row.summary,
      explanation: row.explanation,
      examples: parseJson(row.examples, []),
      commonMistakes: parseJson(row.commonMistakes, []),
      relatedActivityIds: [...new Set(relatedActivityIds)].sort(),
      tags: parseJson(row.tags, []),
      difficulty: row.difficulty as 1 | 2 | 3,
      status: row.statusCode as Lesson["status"],
      contentVersion: row.contentVersion,
    };
  }

  async listLessons(filters?: LessonListFilters): Promise<Lesson[]> {
    const releaseId = await this.requireActiveReleaseId();
    const where: Prisma.LessonVersionWhereInput = {
      releaseId,
      statusCode: "published",
      ...(filters?.level ? { levelCode: filters.level } : {}),
      ...(filters?.category ? { category: filters.category } : {}),
    };
    const [rows, related] = await Promise.all([
      this.db().lessonVersion.findMany({ where, orderBy: { lessonId: "asc" } }),
      this.relatedActivitiesByLesson(releaseId),
    ]);
    return rows.map((row) => this.mapLesson(row, related.get(row.lessonId) ?? []));
  }

  async getLessonById(lessonId: string): Promise<Lesson | null> {
    const releaseId = await this.requireActiveReleaseId();
    const [row, related] = await Promise.all([
      this.db().lessonVersion.findFirst({
        where: { releaseId, lessonId, statusCode: "published" },
        orderBy: { id: "desc" },
      }),
      this.relatedActivitiesByLesson(releaseId),
    ]);
    return row ? this.mapLesson(row, related.get(lessonId) ?? []) : null;
  }

  private mapActivity(row: {
    id: string;
    activityId: string;
    levelCode: string;
    activityTypeCode: string;
    category: string;
    topic: string;
    subtopic: string;
    difficulty: number;
    instructions: string;
    prompt: string;
    passage: string | null;
    explanation: string;
    tags: string;
    lessonIds: string;
    estimatedSeconds: number;
    evaluatorData: string;
    statusCode: string;
    options: Array<{ optionId: string; label: string; position: number }>;
    tokens: Array<{ tokenId: string; label: string; position: number }>;
    pairs: Array<{ leftId: string; leftLabel: string; rightId: string; rightLabel: string; position: number }>;
    lessonLinks: Array<{ lessonId: string; position: number }>;
    taxonomyLinks: Array<{ taxonomyNodeId: string; position: number }>;
  }): Activity {
    const options = [...row.options]
      .sort((a, b) => a.position - b.position)
      .map((option) => ({ id: option.optionId, text: option.label }));
    const tokens = [...row.tokens]
      .sort((a, b) => a.position - b.position)
      .map((token) => ({ id: token.tokenId, text: token.label }));
    const pairs = [...row.pairs]
      .sort((a, b) => a.position - b.position)
      .map((pair) => ({
        leftId: pair.leftId,
        left: pair.leftLabel,
        rightId: pair.rightId,
        right: pair.rightLabel,
      }));
    const lessonIds = row.lessonLinks.length > 0
      ? [...row.lessonLinks].sort((a, b) => a.position - b.position).map((link) => link.lessonId)
      : parseJson(row.lessonIds, []);
    const taxonomyNodeIds = row.taxonomyLinks.length > 0
      ? [...row.taxonomyLinks].sort((a, b) => a.position - b.position).map((link) => link.taxonomyNodeId)
      : [];

    return {
      id: row.activityId,
      versionId: row.id,
      level: row.levelCode as Activity["level"],
      type: row.activityTypeCode,
      category: row.category,
      topic: row.topic,
      subtopic: row.subtopic,
      taxonomyNodeIds,
      difficulty: row.difficulty,
      instructions: row.instructions,
      prompt: row.prompt,
      ...(row.passage ? { passage: row.passage } : {}),
      options: options.length > 0 ? options : undefined,
      tokens: tokens.length > 0 ? tokens : undefined,
      pairs: pairs.length > 0 ? pairs : undefined,
      lessonIds,
      tags: parseJson(row.tags, []),
      estimatedSeconds: row.estimatedSeconds,
      evaluator: parseJson(row.evaluatorData, { strategy: "exact_text", answer: "", normalization: {
        trim: true, collapseWhitespace: true, caseSensitive: false,
        ignoreTerminalPunctuation: true, normaliseApostrophes: true,
      } }) as Activity["evaluator"],
      explanation: row.explanation,
      status: row.statusCode as Activity["status"],
    };
  }

  private activityWhere(
    releaseId: string,
    filters?: ActivityListFilters,
  ): Prisma.ActivityVersionWhereInput {
    return {
      releaseId,
      statusCode: "published",
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
    return rows.map((row) => this.mapActivity(row));
  }

  async getActivityById(activityId: string): Promise<Activity | null> {
    const releaseId = await this.requireActiveReleaseId();
    const row = await this.db().activityVersion.findFirst({
      where: { releaseId, activityId, statusCode: "published" },
      include: this.activityInclude,
      orderBy: { id: "desc" },
    });
    return row ? this.mapActivity(row) : null;
  }

  async countActivitiesByNode(nodeId: string, level: CefrLevel | "both"): Promise<number> {
    const releaseId = await this.requireActiveReleaseId();
    return this.db().activityVersion.count({
      where: {
        releaseId,
        statusCode: "published",
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
        statusCode: "published",
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
      levels: parseJson(row.levels, []) as TaxonomyNode["levels"],
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
    const publication = await this.db().catalogPublication.findUnique({
      where: { id: ACTIVE_PUBLICATION_ID },
      include: { release: true },
    });
    return {
      datasetVersion: publication?.release.datasetVersion ?? "unknown",
      schemaVersion: "1.0.0",
    };
  }

  async getCatalogMetadata(): Promise<CatalogMetadata> {
    const releaseId = await this.activeReleaseId();
    if (!releaseId) {
      return { datasetVersion: "unknown", schemaVersion: "1.0.0", lessonCount: 0, activityCount: 0, taxonomyNodeCount: 0 };
    }
    const [release, lessonCount, activityCount, taxonomyNodeCount] = await Promise.all([
      this.db().catalogRelease.findUnique({ where: { id: releaseId }, select: { datasetVersion: true } }),
      this.db().lessonVersion.count({ where: { releaseId, statusCode: "published" } }),
      this.db().activityVersion.count({ where: { releaseId, statusCode: "published" } }),
      this.db().taxonomyNodeVersion.count({ where: { releaseId } }),
    ]);
    return {
      datasetVersion: release?.datasetVersion ?? "unknown",
      schemaVersion: "1.0.0",
      lessonCount,
      activityCount,
      taxonomyNodeCount,
    };
  }
}
