import { describe, expect, it } from "vitest";
import type { PrismaClient } from "@/generated/prisma/client";
import { DatasetUnavailableException } from "@/core/shared/exceptions";
import { UNKNOWN_DATASET_VERSION } from "@/core/content/domain/content-version";
import { PrismaCatalogAdapter } from "./prisma-catalog-adapter";
import { encodeCursor } from "@/core/shared/kernel";

function catalogClient(options: { publication?: "published" | "draft" | null; pageRows?: boolean; calls?: Array<{ model: string; args: unknown }> } = {}) {
  const publication = options.publication === null
    ? null
    : {
        releaseId: "release-1",
        release: { status: options.publication ?? "published" },
      };
  const lessonRows = [
    {
      id: "lesson-version-1", lessonId: "lesson-1", levelCode: "B1", category: "grammar",
      taxonomyNodeId: "grammar", title: "Grammar", summary: "Summary", explanation: "Explain",
      prerequisites: "[]",
      examples: "[\"Example\"]", commonMistakes: "not-json", tags: "[\"tag\"]", difficulty: 1,
      contentVersion: 1, statusCode: "published",
    },
  ];
  const activityRows = [
    {
      id: "activity-version-1", activityId: "activity-1", levelCode: "B1", activityTypeCode: "choice",
      category: "grammar", topic: "grammar", subtopic: "articles", difficulty: 2,
      instructions: "Choose", prompt: "Prompt", passage: "Passage", explanation: "Explain",
      tags: "[]", lessonIds: "[\"lesson-1\"]", estimatedSeconds: 30,
      evaluatorData: "{\"strategy\":\"single_option\",\"correctOptionId\":\"correct\"}", statusCode: "published",
      options: [
        { optionId: "wrong", label: "Wrong", feedback: null, position: 1 },
        { optionId: "correct", label: "Correct", feedback: "Good", position: 0 },
      ],
      tokens: [{ tokenId: "token-1", label: "word", feedback: null, position: 0 }],
      pairs: [{ leftId: "left", leftLabel: "Left", rightId: "right", rightLabel: "Right", position: 0 }],
      lessonLinks: [{ lessonId: "lesson-1", position: 0 }, { lessonId: "lesson-1", position: 1 }],
      taxonomyLinks: [{ taxonomyNodeId: "grammar", position: 0 }],
    },
  ];
  const taxonomyRows = [
    { nodeId: "grammar", parentId: null, kind: "category", labelsEn: "Grammar", labelsEs: "Gramática", levels: "[\"B1\"]", selectableForPractice: true, sortOrder: 2 },
    { nodeId: "articles", parentId: "grammar", kind: "topic", labelsEn: "Articles", labelsEs: "Artículos", levels: "[\"B1\"]", selectableForPractice: true, sortOrder: 1 },
    { nodeId: "verbs", parentId: "grammar", kind: "topic", labelsEn: "Verbs", labelsEs: "Verbos", levels: "not-json", selectableForPractice: false, sortOrder: 0 },
    { nodeId: "orphan", parentId: "missing", kind: "topic", labelsEn: "Orphan", labelsEs: "Huérfano", levels: "[]", selectableForPractice: true, sortOrder: 0 },
    { nodeId: "vocabulary", parentId: null, kind: "category", labelsEn: "Vocabulary", labelsEs: "Vocabulario", levels: "[]", selectableForPractice: true, sortOrder: 0 },
  ];
  const db = {
    catalogPublication: { findUnique: async () => publication },
    catalogRelease: { findUnique: async () => ({ datasetVersion: "dataset-1" }) },
    lessonVersion: {
      findMany: async (args: { take?: number } = {}) => {
        options.calls?.push({ model: "lesson", args });
        return options.pageRows && args.take ? [...lessonRows, { ...lessonRows[0], id: "lesson-version-2", lessonId: "lesson-2" }] : lessonRows;
      },
      findFirst: async ({ where }: { where: { lessonId: string } }) => where.lessonId === "lesson-1" ? lessonRows[0] : null,
      count: async () => 1,
    },
    activityVersion: {
      findMany: async (args: { select?: unknown; take?: number } = {}) => {
        options.calls?.push({ model: "activity", args });
        return args.select ? activityRows.map((row) => ({ activityId: row.activityId, lessonLinks: row.lessonLinks })) : options.pageRows && args.take ? [...activityRows, { ...activityRows[0], id: "activity-version-2", activityId: "activity-2" }] : activityRows;
      },
      findFirst: async ({ where }: { where: { activityId?: string; id?: string } }) => where.activityId === "activity-1" || where.id === "activity-version-1" ? activityRows[0] : null,
      count: async () => 4,
    },
    activityVersionLesson: {
      findMany: async (args: unknown = {}) => {
        options.calls?.push({ model: "activity-lesson", args });
        return activityRows.flatMap((row) => row.lessonLinks.map((link) => ({
          lessonId: link.lessonId,
          position: link.position,
          activityVersion: { activityId: row.activityId },
        })));
      },
    },
    taxonomyNodeVersion: { findMany: async () => taxonomyRows, count: async () => 5 },
  };
  return db as unknown as PrismaClient;
}

describe("PrismaCatalogAdapter", () => {
  it("rejects reads while the publication is absent or not published", async () => {
    for (const publication of [null, "draft"] as const) {
      const adapter = new PrismaCatalogAdapter(catalogClient({ publication }));
      await expect(adapter.listLessons()).rejects.toBeInstanceOf(DatasetUnavailableException);
      await expect(adapter.getContentVersion()).resolves.toEqual({ datasetVersion: UNKNOWN_DATASET_VERSION, schemaVersion: "1.0.0" });
      await expect(adapter.getCatalogMetadata()).resolves.toMatchObject({ lessonCount: 0, activityCount: 0, taxonomyNodeCount: 0 });
    }
  });

  it("lists and resolves published lessons and activities through every filter shape", async () => {
    const adapter = new PrismaCatalogAdapter(catalogClient());
    await expect(adapter.listLessons()).resolves.toHaveLength(1);
    await expect(adapter.listLessons({ level: "B1", category: "grammar" })).resolves.toMatchObject([{ id: "lesson-1", relatedActivityIds: ["activity-1"] }]);
    await expect(adapter.listLessonsPage({ level: "B1" }, { limit: 2 })).resolves.toMatchObject({ items: [{ id: "lesson-1" }], hasMore: false, nextCursor: null });
    await expect(adapter.getLessonById("lesson-1")).resolves.toMatchObject({ id: "lesson-1" });
    await expect(adapter.getLessonById("missing")).resolves.toBeNull();

    await expect(adapter.listActivities()).resolves.toMatchObject([{ id: "activity-1", options: [{ id: "correct" }, { id: "wrong" }] }]);
    await expect(adapter.listActivities({ level: "B1", taxonomyNodeId: "grammar", lessonIds: ["lesson-1"] })).resolves.toHaveLength(1);
    await expect(adapter.listActivities({ level: "both", lessonIds: [] })).resolves.toHaveLength(1);
    await expect(adapter.listActivitiesPage(undefined, { limit: 2 })).resolves.toMatchObject({ items: [{ id: "activity-1" }], hasMore: false, nextCursor: null });
    await expect(adapter.listLessonsPage({ level: "B1", category: "grammar" }, { limit: 2, cursor: encodeCursor("lesson-0") })).resolves.toMatchObject({ items: [{ id: "lesson-1" }] });
    await expect(adapter.searchLessonsPage({ level: "B1", query: "grammar" }, { page: 1, pageSize: 12 })).resolves.toMatchObject({ items: [{ id: "lesson-1" }], total: 1 });

    const pagedAdapter = new PrismaCatalogAdapter(catalogClient({ pageRows: true }));
    await expect(pagedAdapter.listLessonsPage(undefined, { limit: 1 })).resolves.toMatchObject({ items: [{ id: "lesson-1" }], hasMore: true });
    await expect(pagedAdapter.listLessonsPage(undefined, { limit: 2 })).resolves.toMatchObject({ items: [{ id: "lesson-1" }, { id: "lesson-2" }], hasMore: false });
    await expect(pagedAdapter.listActivitiesPage({ level: "B1", taxonomyNodeId: "grammar", lessonIds: ["lesson-1"] }, { limit: 1, cursor: encodeCursor("activity-0") })).resolves.toMatchObject({ items: [{ id: "activity-1" }], hasMore: true });
    await expect(adapter.searchActivitiesPage({ query: "prompt", taxonomyNodeIds: ["grammar"], activityType: "choice", interactionMode: "standard" }, { page: 1, pageSize: 12 })).resolves.toMatchObject({ items: [{ id: "activity-1" }], total: 4 });
    await expect(adapter.getActivityById("activity-1")).resolves.toMatchObject({ id: "activity-1", passage: "Passage" });
    await expect(adapter.getActivityById("missing")).resolves.toBeNull();
    await expect(adapter.getActivityByVersionId("activity-version-1")).resolves.toMatchObject({ id: "activity-1", versionId: "activity-version-1" });
    await expect(adapter.getActivityByVersionId("missing-version")).resolves.toBeNull();
    await expect(adapter.countActivitiesByNode("grammar", "B1")).resolves.toBe(4);
    await expect(adapter.countActivitiesByNode("grammar", "both")).resolves.toBe(4);
    await expect(adapter.countActivitiesByNodes([], "B1")).resolves.toBe(0);
    await expect(adapter.countActivitiesByNodes(["grammar"], "both")).resolves.toBe(4);
  });

  it("includes demo-marked content for regular users and restricts demo users", async () => {
    const regularCalls: Array<{ model: string; args: unknown }> = [];
    await new PrismaCatalogAdapter(catalogClient({ calls: regularCalls })).listLessons();
    const regularLessonWhere = (regularCalls.find((call) => call.model === "lesson")?.args as { where: Record<string, unknown> }).where;
    expect(regularLessonWhere).not.toHaveProperty("lesson");

    const demoCalls: Array<{ model: string; args: unknown }> = [];
    await new PrismaCatalogAdapter(catalogClient({ calls: demoCalls }), { includeDemo: true }).listLessons();
    const demoLessonWhere = (demoCalls.find((call) => call.model === "lesson")?.args as { where: Record<string, unknown> }).where;
    expect(demoLessonWhere).toMatchObject({ lesson: { is: { isDemo: true } } });
  });

  it("resolves related activities through the junction table", async () => {
    const calls: Array<{ model: string; args: unknown }> = [];
    const adapter = new PrismaCatalogAdapter(catalogClient({ calls }));

    await adapter.searchLessonsPage(undefined, { page: 1, pageSize: 12 });

    const junctionCall = calls.find((call) => call.model === "activity-lesson");
    expect(junctionCall).toBeDefined();
    expect(junctionCall?.args).toMatchObject({ where: { lessonId: { in: ["lesson-1"] } } });
    expect(calls.some((call) => call.model === "activity" && Boolean((call.args as { select?: unknown }).select))).toBe(false);
  });

  it("builds taxonomy trees, descendant lists, paths and metadata", async () => {
    const adapter = new PrismaCatalogAdapter(catalogClient());
    const tree = await adapter.getTaxonomyTree();
    expect(tree.map((node) => node.id)).toEqual(["vocabulary", "grammar"]);
    expect(tree[1]?.children.map((node) => node.id)).toEqual(["verbs", "articles"]);
    await expect(adapter.resolveNodeWithDescendants("grammar")).resolves.toHaveLength(3);
    await expect(adapter.resolveNodeWithDescendants("missing")).resolves.toEqual([]);
    await expect(adapter.getNodePath("articles")).resolves.toMatchObject([{ id: "grammar" }, { id: "articles" }]);
    await expect(adapter.getNodePath("missing")).resolves.toEqual([]);
    await expect(adapter.getContentVersion()).resolves.toEqual({ datasetVersion: "dataset-1", schemaVersion: "1.0.0" });
    await expect(adapter.getCatalogMetadata()).resolves.toMatchObject({ datasetVersion: "dataset-1", lessonCount: 1, activityCount: 4, taxonomyNodeCount: 5 });
  });
});
