import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const ctor = (methods: Record<string, unknown> = {}) => vi.fn(function MockConstructor() {
    return { ...methods };
  });

  const fileTaxonomy = {
    getTaxonomyTree: vi.fn().mockResolvedValue([{ id: "root" }]),
    getContentVersion: vi.fn().mockResolvedValue({ datasetVersion: "0.1.0" }),
  };
  const databaseCatalog = {
    getTaxonomyTree: vi.fn().mockResolvedValue([{ id: "root" }]),
    getContentVersion: vi.fn().mockResolvedValue({ datasetVersion: "db-0.1.0" }),
  };

  return {
    prisma: { $queryRaw: vi.fn().mockResolvedValue([{ ok: 1 }]) },
    config: {
      contentSource: "dataset",
      databaseProvider: "sqlite",
      databaseUrl: "file:test.db",
      d1Transport: "binding",
      d1HttpUrl: null,
      d1HttpToken: null,
      nodeEnv: "test",
      betterAuthSecret: "secret",
      betterAuthUrl: "https://english-loop.test",
      attemptRateLimitWindowMs: 60_000,
      attemptRateLimitMax: 30,
      authRateLimitWindowMs: 60_000,
      authRateLimitMax: 10,
    },
    PrismaUnitOfWorkAdapter: ctor(),
    BetterAuthIdentityAdapter: ctor(),
    PrismaUserSettingsRepository: ctor(),
    PrismaSavedLessonRepository: ctor(),
    PrismaAttemptRepository: ctor(),
    PrismaPracticeRunRepository: ctor(),
    PrismaProgressRepository: ctor(),
    PrismaReviewRepository: ctor(),
    PrismaDailySessionRepository: ctor(),
    PrismaLessonProgressRepository: ctor(),
    FileLessonCatalogAdapter: ctor(),
    FileActivityCatalogAdapter: ctor(),
    FileTaxonomyCatalogAdapter: ctor(fileTaxonomy),
    FileCatalogMetadataAdapter: ctor(),
    PrismaCatalogAdapter: ctor(databaseCatalog),
    PrismaCatalogWriteAdapter: ctor(),
    PracticeRunPlanner: ctor(),
    DailySessionPlanner: ctor(),
    DailyPracticePlanner: ctor(),
    SystemRandomSource: ctor(),
    StructuredLogger: ctor(),
    StructuredDomainEventDispatcher: ctor(),
    SystemClock: ctor(),
    UuidIdGenerator: ctor(),
    InMemoryRateLimiter: ctor(),
    PrismaRateLimiter: ctor(),
    fileTaxonomy,
    databaseCatalog,
  };
});

vi.mock("@/server/infrastructure/database/prisma-client", () => ({ prisma: mocks.prisma }));
vi.mock("@/server/infrastructure/config/config", () => ({ config: mocks.config }));
vi.mock("@/server/infrastructure/database/prisma-unit-of-work-adapter", () => ({ PrismaUnitOfWorkAdapter: mocks.PrismaUnitOfWorkAdapter }));
vi.mock("@/server/infrastructure/auth/better-auth-identity-adapter", () => ({ BetterAuthIdentityAdapter: mocks.BetterAuthIdentityAdapter }));
vi.mock("@/server/infrastructure/persistence/prisma-user-settings-repository", () => ({ PrismaUserSettingsRepository: mocks.PrismaUserSettingsRepository }));
vi.mock("@/server/infrastructure/persistence/prisma-saved-lesson-repository", () => ({ PrismaSavedLessonRepository: mocks.PrismaSavedLessonRepository }));
vi.mock("@/server/infrastructure/persistence/prisma-attempt-repository", () => ({ PrismaAttemptRepository: mocks.PrismaAttemptRepository }));
vi.mock("@/server/infrastructure/persistence/prisma-practice-run-repository", () => ({ PrismaPracticeRunRepository: mocks.PrismaPracticeRunRepository }));
vi.mock("@/server/infrastructure/persistence/prisma-progress-repository", () => ({ PrismaProgressRepository: mocks.PrismaProgressRepository }));
vi.mock("@/server/infrastructure/persistence/prisma-review-repository", () => ({ PrismaReviewRepository: mocks.PrismaReviewRepository }));
vi.mock("@/server/infrastructure/persistence/prisma-daily-session-repository", () => ({ PrismaDailySessionRepository: mocks.PrismaDailySessionRepository }));
vi.mock("@/server/infrastructure/persistence/prisma-lesson-progress-repository", () => ({ PrismaLessonProgressRepository: mocks.PrismaLessonProgressRepository }));
vi.mock("@/adapters/content/file-lesson-catalog-adapter", () => ({ FileLessonCatalogAdapter: mocks.FileLessonCatalogAdapter }));
vi.mock("@/adapters/content/file-activity-catalog-adapter", () => ({ FileActivityCatalogAdapter: mocks.FileActivityCatalogAdapter }));
vi.mock("@/adapters/content/file-taxonomy-catalog-adapter", () => ({ FileTaxonomyCatalogAdapter: mocks.FileTaxonomyCatalogAdapter }));
vi.mock("@/adapters/content/file-catalog-metadata-adapter", () => ({ FileCatalogMetadataAdapter: mocks.FileCatalogMetadataAdapter }));
vi.mock("@/adapters/content/prisma-catalog-adapter", () => ({ PrismaCatalogAdapter: mocks.PrismaCatalogAdapter }));
vi.mock("@/server/infrastructure/persistence/prisma-catalog-write-adapter", () => ({ PrismaCatalogWriteAdapter: mocks.PrismaCatalogWriteAdapter }));
vi.mock("@/core/practice/domain/practice-run-planner", () => ({ PracticeRunPlanner: mocks.PracticeRunPlanner }));
vi.mock("@/core/learning/domain/daily-session-planner", () => ({ DailySessionPlanner: mocks.DailySessionPlanner }));
vi.mock("@/core/learning/domain/daily-practice-planner", () => ({ DailyPracticePlanner: mocks.DailyPracticePlanner }));
vi.mock("@/server/infrastructure/random/system-random-source", () => ({ SystemRandomSource: mocks.SystemRandomSource }));
vi.mock("@/server/infrastructure/logging/structured-logger", () => ({ StructuredLogger: mocks.StructuredLogger }));
vi.mock("@/server/infrastructure/events/structured-domain-event-dispatcher", () => ({ StructuredDomainEventDispatcher: mocks.StructuredDomainEventDispatcher }));
vi.mock("@/server/infrastructure/clock/system-clock", () => ({ SystemClock: mocks.SystemClock }));
vi.mock("@/server/infrastructure/id/uuid-id-generator", () => ({ UuidIdGenerator: mocks.UuidIdGenerator }));
vi.mock("@/server/infrastructure/security/rate-limiter", () => ({ InMemoryRateLimiter: mocks.InMemoryRateLimiter }));
vi.mock("@/server/infrastructure/security/prisma-rate-limiter", () => ({ PrismaRateLimiter: mocks.PrismaRateLimiter }));

describe("CompositionRoot wiring", () => {
  it("constructs dataset and database ports and reports health independently", async () => {
    const { CompositionRoot } = await import("./composition-root");
    const root = new CompositionRoot();

    expect(root.getLessonCatalog()).toBe(root.getLessonCatalog());
    expect(root.getActivityCatalog()).toBe(root.getActivityCatalog());
    expect(root.getTaxonomyCatalog()).toBe(root.getTaxonomyCatalog());
    expect(root.getCatalogMetadata()).toBe(root.getCatalogMetadata());
    expect(root.getCatalogWritePort()).toBeTruthy();
    await expect(root.getDatasetVersion()).resolves.toBe("0.1.0");
    await expect(root.checkDatabase()).resolves.toBe(true);
    await expect(root.checkCatalog()).resolves.toBe(true);
    expect(root.checkAuth()).toBe(true);

    mocks.prisma.$queryRaw.mockRejectedValueOnce(new Error("database unavailable"));
    await expect(root.checkDatabase()).resolves.toBe(false);
    mocks.fileTaxonomy.getTaxonomyTree.mockRejectedValueOnce(new Error("catalog unavailable"));
    await expect(root.checkCatalog()).resolves.toBe(false);

    mocks.config.contentSource = "database";
    expect(root.getLessonCatalog()).toBe(root.getActivityCatalog());
    expect(root.getTaxonomyCatalog()).toBe(root.getCatalogMetadata());
    await expect(root.getDatasetVersion()).resolves.toBe("db-0.1.0");
    await expect(root.checkCatalog()).resolves.toBe(true);
    mocks.config.betterAuthSecret = "";
    mocks.config.betterAuthUrl = "";
    expect(root.checkAuth()).toBe(false);
  });
});
