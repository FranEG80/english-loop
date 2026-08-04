// @vitest-environment node
import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaUserSettingsRepository } from "@/server/infrastructure/persistence/prisma-user-settings-repository";
import { UserSettings } from "@/core/account/domain/user-settings";

/**
 * Contract test del repositorio de settings. Se ejecuta contra SQLite y
 * podrá ejecutarse contra PostgreSQL sin modificar el core.
 */
describe("UserSettingsRepository contract", () => {
  let prisma: PrismaClient;
  let repository: PrismaUserSettingsRepository;

  beforeAll(async () => {
    const adapter = new PrismaBetterSqlite3({
      url: ":memory:",
    });
    prisma = new PrismaClient({ adapter });
    repository = new PrismaUserSettingsRepository(prisma);
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "UserSettings"`);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE "UserSettings" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL UNIQUE,
        "locale" TEXT NOT NULL DEFAULT 'es',
        "activeLevels" TEXT NOT NULL DEFAULT 'B1',
        "dailyGoalLessons" INTEGER NOT NULL DEFAULT 1,
        "dailyGoalActivities" INTEGER NOT NULL DEFAULT 10,
        "timezone" TEXT NOT NULL DEFAULT 'UTC',
        "reducedMotion" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL
      )
    `);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("returns null when settings do not exist", async () => {
    const result = await repository.findByUserId("missing-user");
    expect(result).toBeNull();
  });

  it("saves and retrieves settings", async () => {
    const settings = UserSettings.create({
      userId: "user-1",
      locale: "es",
      activeLevels: ["B1", "B2"],
      dailyGoalLessons: 1,
      dailyGoalActivities: 10,
      timezone: "Europe/Madrid",
      reducedMotion: false,
    });
    await repository.save(settings);

    const found = await repository.findByUserId("user-1");
    expect(found).not.toBeNull();
    expect(found?.userId).toBe("user-1");
    expect(found?.activeLevels).toEqual(["B1", "B2"]);
    expect(found?.timezone).toBe("Europe/Madrid");
  });

  it("updates existing settings idempotently", async () => {
    const updated = UserSettings.create({
      userId: "user-1",
      locale: "en",
      activeLevels: ["B2"],
      dailyGoalLessons: 2,
      dailyGoalActivities: 15,
      timezone: "UTC",
      reducedMotion: true,
    });
    await repository.save(updated);

    const found = await repository.findByUserId("user-1");
    expect(found?.locale).toBe("en");
    expect(found?.activeLevels).toEqual(["B2"]);
    expect(found?.reducedMotion).toBe(true);
  });
});
