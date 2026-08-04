// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import type { CatalogSeedInput } from "@/core/content/ports/catalog-write-port";
import { PrismaCatalogWriteAdapter } from "./prisma-catalog-write-adapter";
import { PrismaCatalogAdapter } from "@/adapters/content/prisma-catalog-adapter";

const enabled = process.env.RUN_DB_INTEGRATION === "1";
const describeDatabase = enabled ? describe : describe.skip;

function seedInput(checksum: string, lessonIds = ["lesson-1"]): CatalogSeedInput {
  return {
    datasetVersion: "integration-v1",
    checksum,
    taxonomy: [{
      id: "grammar",
      checksum: "taxonomy-checksum",
      parentId: null,
      kind: "category",
      labels: { en: "Grammar", es: "Gramática" },
      levels: ["B1"],
      selectableForPractice: true,
      order: 0,
    }],
    lessons: [{
      id: "lesson-1",
      checksum: "lesson-checksum",
      level: "B1",
      category: "grammar",
      taxonomyNodeId: "grammar",
      title: "Lesson",
      summary: "Summary",
      explanation: "Explanation",
      examples: [],
      commonMistakes: [],
      tags: [],
      difficulty: 1,
      contentVersion: 1,
      status: "published",
    }],
    activities: [{
      id: "activity-1",
      checksum: "activity-checksum",
      type: "choice",
      evaluatorStrategy: "single_option",
      level: "B1",
      category: "grammar",
      topic: "grammar",
      subtopic: "grammar",
      difficulty: 1,
      instructions: "Choose",
      prompt: "Prompt",
      explanation: "Explanation",
      tags: [],
      lessonIds,
      taxonomyNodeIds: ["grammar"],
      estimatedSeconds: 30,
      evaluator: { strategy: "single_option", correctOptionId: "correct" },
      options: [
        { id: "correct", text: "Correct", feedback: "That is correct." },
        { id: "wrong", text: "Wrong", feedback: "Try again." },
      ],
      tokens: [],
      pairs: [],
      expectedAnswers: [{ gapId: null, answer: "correct", position: 0 }],
      status: "published",
    }],
  };
}

describeDatabase("normalized catalog seed integration", () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = new PrismaClient({
      adapter: new PrismaBetterSqlite3({
        url: process.env.TEST_DATABASE_URL ?? "file:./test-catalog.db",
      }),
    });
    await prisma.catalogPublication.deleteMany();
    await prisma.activityAttempt.deleteMany();
    await prisma.practiceRunItem.deleteMany();
    await prisma.activityVersion.deleteMany();
    await prisma.lessonVersion.deleteMany();
    await prisma.taxonomyNodeVersion.deleteMany();
    await prisma.datasetImport.deleteMany();
    await prisma.catalogRelease.deleteMany();
    await prisma.activity.deleteMany();
    await prisma.lesson.deleteMany();
    await prisma.taxonomyNode.deleteMany();
    await prisma.activityType.deleteMany();
    await prisma.evaluatorStrategy.deleteMany();
    await prisma.cefrLevel.deleteMany();
    await prisma.editorialStatus.deleteMany();
  });

  afterAll(async () => prisma.$disconnect());

  it("publishes atomically, is idempotent and preserves feedback in read DTOs", async () => {
    const writer = new PrismaCatalogWriteAdapter(prisma);
    await expect(writer.seedCatalog(seedInput("checksum-dry"), { dryRun: true })).resolves.toMatchObject({ status: "dry_run", releaseId: null });
    const first = await writer.seedCatalog(seedInput("checksum-1"));
    const repeated = await writer.seedCatalog(seedInput("checksum-1"));
    const catalog = new PrismaCatalogAdapter(prisma);
    const activity = await catalog.getActivityById("activity-1");
    const lesson = await catalog.getLessonById("lesson-1");

    expect(first.status).toBe("published");
    expect(repeated.status).toBe("unchanged");
    expect(repeated.releaseId).toBe(first.releaseId);
    expect(activity?.options?.[0]?.feedback).toBe("That is correct.");
    expect(lesson?.relatedActivityIds).toEqual(["activity-1"]);
    await prisma.catalogPublication.delete({ where: { id: "active" } });
    const republished = await writer.seedCatalog(seedInput("checksum-1"));
    expect(republished.status).toBe("unchanged");
    expect((await prisma.catalogPublication.findUnique({ where: { id: "active" } }))?.releaseId).toBe(first.releaseId);
  });

  it("does not move the active pointer when a relationship fails", async () => {
    const writer = new PrismaCatalogWriteAdapter(prisma);
    const before = await prisma.catalogPublication.findUnique({ where: { id: "active" } });

    await expect(
      writer.seedCatalog(seedInput("checksum-invalid", ["missing-lesson"])),
    ).rejects.toBeInstanceOf(Error);

    const after = await prisma.catalogPublication.findUnique({ where: { id: "active" } });
    expect(after?.releaseId).toBe(before?.releaseId);
    expect(await prisma.activityVersion.count({ where: { releaseId: { not: before?.releaseId ?? "" } } })).toBe(0);
  });
});
