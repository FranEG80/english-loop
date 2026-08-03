// @vitest-environment node
import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaReviewRepository } from "@/server/infrastructure/persistence/prisma-review-repository";
import { ReviewItem } from "@/core/progress/domain/review-item";

/**
 * Contract test del repositorio de repasos. Se ejecuta contra SQLite y
 * podrá ejecutarse contra PostgreSQL sin modificar el core.
 */
describe("ReviewRepository contract", () => {
  let prisma: PrismaClient;
  let repository: PrismaReviewRepository;

  beforeAll(async () => {
    const adapter = new PrismaBetterSqlite3({
      url: "file:./test-contract.db",
    });
    prisma = new PrismaClient({ adapter });
    repository = new PrismaReviewRepository(prisma);
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "ReviewItem"`);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE "ReviewItem" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "activityId" TEXT NOT NULL,
        "activityVersionId" TEXT,
        "lessonId" TEXT,
        "taxonomyNodeId" TEXT NOT NULL,
        "level" TEXT NOT NULL,
        "stage" INTEGER NOT NULL DEFAULT 0,
        "consecutiveCorrect" INTEGER NOT NULL DEFAULT 0,
        "dueAt" DATETIME NOT NULL,
        "failedAt" DATETIME NOT NULL,
        "resolvedAt" DATETIME,
        "attemptsCount" INTEGER NOT NULL DEFAULT 0,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL
      )
    `);
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "ReviewItem_userId_dueAt_idx" ON "ReviewItem"("userId", "dueAt")`,
    );
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("returns null when no review exists", async () => {
    const result = await repository.findByUserIdAndActivity("u1", "a1");
    expect(result).toBeNull();
  });

  it("saves and retrieves a review item", async () => {
    const item = ReviewItem.create({
      id: "review-1",
      userId: "u1",
      activityId: "a1",
      taxonomyNodeId: "grammar",
      level: "B1",
      stage: 0,
      consecutiveCorrect: 0,
      dueAt: "2026-08-04T00:00:00.000Z",
      failedAt: "2026-08-03T00:00:00.000Z",
      resolvedAt: null,
      attemptsCount: 1,
    });
    await repository.save(item);

    const found = await repository.findByUserIdAndActivity("u1", "a1");
    expect(found).not.toBeNull();
    expect(found?.id).toBe("review-1");
    expect(found?.stage).toBe(0);
  });

  it("finds due items", async () => {
    const due = await repository.findDueByUserId(
      "u1",
      "2026-08-05T00:00:00.000Z",
    );
    expect(due.some((item) => item.id === "review-1")).toBe(true);
  });
});
