import "server-only";
import { prisma } from "@/server/infrastructure/database/prisma-client";
import { PrismaUnitOfWorkAdapter } from "@/server/infrastructure/database/prisma-unit-of-work-adapter";
import { BetterAuthIdentityAdapter } from "@/server/infrastructure/auth/better-auth-identity-adapter";
import { PrismaUserSettingsRepository } from "@/server/infrastructure/persistence/prisma-user-settings-repository";
import { PrismaSavedLessonRepository } from "@/server/infrastructure/persistence/prisma-saved-lesson-repository";
import { PrismaAttemptRepository } from "@/server/infrastructure/persistence/prisma-attempt-repository";
import { PrismaPracticeRunRepository } from "@/server/infrastructure/persistence/prisma-practice-run-repository";
import { PrismaProgressRepository } from "@/server/infrastructure/persistence/prisma-progress-repository";
import { PrismaReviewRepository } from "@/server/infrastructure/persistence/prisma-review-repository";
import { PrismaDailySessionRepository } from "@/server/infrastructure/persistence/prisma-daily-session-repository";
import { PrismaLessonProgressRepository } from "@/server/infrastructure/persistence/prisma-lesson-progress-repository";
import { FileLessonCatalogAdapter } from "@/adapters/content/file-lesson-catalog-adapter";
import { FileActivityCatalogAdapter } from "@/adapters/content/file-activity-catalog-adapter";
import { FileTaxonomyCatalogAdapter } from "@/adapters/content/file-taxonomy-catalog-adapter";
import { FileCatalogMetadataAdapter } from "@/adapters/content/file-catalog-metadata-adapter";
import { PrismaCatalogAdapter } from "@/adapters/content/prisma-catalog-adapter";
import { PrismaCatalogWriteAdapter } from "@/server/infrastructure/persistence/prisma-catalog-write-adapter";
import { PracticeRunPlanner } from "@/core/practice/domain/practice-run-planner";
import { DailySessionPlanner } from "@/core/learning/domain/daily-session-planner";
import { DailyPracticePlanner } from "@/core/learning/domain/daily-practice-planner";
import { SystemRandomSource } from "@/server/infrastructure/random/system-random-source";
import { StructuredLogger } from "@/server/infrastructure/logging/structured-logger";
import { StructuredDomainEventDispatcher } from "@/server/infrastructure/events/structured-domain-event-dispatcher";
import { SystemClock } from "@/server/infrastructure/clock/system-clock";
import { UuidIdGenerator } from "@/server/infrastructure/id/uuid-id-generator";
import { InMemoryRateLimiter } from "@/server/infrastructure/security/rate-limiter";
import { PrismaRateLimiter } from "@/server/infrastructure/security/prisma-rate-limiter";
import { config } from "@/server/infrastructure/config/config";
import type {
  ActivityCatalogPort,
  LessonCatalogPort,
  TaxonomyCatalogPort,
  CatalogMetadataPort,
} from "@/core/content/ports/catalog-ports";
import type { CatalogWritePort } from "@/core/content/ports/catalog-write-port";
import { UNKNOWN_DATASET_VERSION } from "@/core/content/domain/content-version";
import { readFileSync } from "node:fs";
import path from "node:path";

const DATASET_ROOT = path.join(process.cwd(), "DATASET");

function readDatasetVersionSync(): string {
  try {
    return readFileSync(path.join(DATASET_ROOT, "VERSION"), "utf8").trim();
  } catch {
    return UNKNOWN_DATASET_VERSION;
  }
}

/**
 * Composition root: único lugar que conoce las implementaciones concretas.
 * Construye los adaptadores y expone los casos de uso del backend.
 */
export class CompositionRoot {
  readonly unitOfWork = new PrismaUnitOfWorkAdapter(prisma);
  readonly identity = new BetterAuthIdentityAdapter();
  readonly userSettingsRepository = new PrismaUserSettingsRepository(prisma);
  readonly savedLessonRepository = new PrismaSavedLessonRepository(prisma);
  readonly attemptRepository = new PrismaAttemptRepository(prisma);
  readonly practiceRunRepository = new PrismaPracticeRunRepository(prisma);
  readonly progressRepository = new PrismaProgressRepository(prisma);
  readonly reviewRepository = new PrismaReviewRepository(prisma);
  readonly dailySessionRepository = new PrismaDailySessionRepository(prisma);
  readonly lessonProgressRepository = new PrismaLessonProgressRepository(prisma);
  readonly randomSource = new SystemRandomSource();
  readonly clock = new SystemClock();
  readonly logger = new StructuredLogger(this.clock);
  readonly domainEventDispatcher = new StructuredDomainEventDispatcher(
    this.logger,
  );
  readonly idGenerator = new UuidIdGenerator();
  readonly attemptRateLimiter = config.nodeEnv === "production"
    ? new PrismaRateLimiter(prisma, config.attemptRateLimitWindowMs, config.attemptRateLimitMax, this.clock)
    : new InMemoryRateLimiter(config.attemptRateLimitWindowMs, config.attemptRateLimitMax, this.clock);
  readonly authRateLimiter = config.nodeEnv === "production"
    ? new PrismaRateLimiter(prisma, config.authRateLimitWindowMs, config.authRateLimitMax, this.clock)
    : new InMemoryRateLimiter(config.authRateLimitWindowMs, config.authRateLimitMax, this.clock);
  readonly practiceRunPlanner = new PracticeRunPlanner(this.randomSource);
  readonly dailySessionPlanner = new DailySessionPlanner(this.randomSource);
  readonly dailyPracticePlanner = new DailyPracticePlanner(this.randomSource);

  private lessonCatalog: FileLessonCatalogAdapter | null = null;
  private activityCatalog: FileActivityCatalogAdapter | null = null;
  private taxonomyCatalog: FileTaxonomyCatalogAdapter | null = null;
  private catalogMetadata: FileCatalogMetadataAdapter | null = null;
  private databaseCatalog: PrismaCatalogAdapter | null = null;
  private readonly datasetVersion = readDatasetVersionSync();

  private getDatabaseCatalog(): PrismaCatalogAdapter {
    if (!this.databaseCatalog) this.databaseCatalog = new PrismaCatalogAdapter(prisma);
    return this.databaseCatalog;
  }

  getCatalogWritePort(): CatalogWritePort {
    return new PrismaCatalogWriteAdapter(prisma);
  }

  getLessonCatalog(): LessonCatalogPort {
    if (config.contentSource === "database") return this.getDatabaseCatalog();
    if (!this.lessonCatalog) {
      this.lessonCatalog = new FileLessonCatalogAdapter(DATASET_ROOT);
    }
    return this.lessonCatalog;
  }

  getActivityCatalog(): ActivityCatalogPort {
    if (config.contentSource === "database") return this.getDatabaseCatalog();
    if (!this.activityCatalog) {
      this.activityCatalog = new FileActivityCatalogAdapter(DATASET_ROOT);
    }
    return this.activityCatalog;
  }

  getTaxonomyCatalog(): TaxonomyCatalogPort {
    if (config.contentSource === "database") return this.getDatabaseCatalog();
    if (!this.taxonomyCatalog) {
      this.taxonomyCatalog = new FileTaxonomyCatalogAdapter(
        DATASET_ROOT,
        this.datasetVersion,
      );
    }
    return this.taxonomyCatalog;
  }

  getCatalogMetadata(): CatalogMetadataPort {
    if (config.contentSource === "database") return this.getDatabaseCatalog();
    if (!this.catalogMetadata) {
      this.catalogMetadata = new FileCatalogMetadataAdapter(DATASET_ROOT);
    }
    return this.catalogMetadata;
  }

  async getDatasetVersion(): Promise<string> {
    if (config.contentSource === "database") {
      return (await this.getDatabaseCatalog().getContentVersion()).datasetVersion;
    }
    return this.datasetVersion;
  }

  async checkDatabase(): Promise<boolean> {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  async checkCatalog(): Promise<boolean> {
    try {
      const catalog = this.getTaxonomyCatalog();
      const [tree, version] = await Promise.all([
        catalog.getTaxonomyTree(),
        catalog.getContentVersion(),
      ]);
      return tree.length > 0 && version.datasetVersion !== UNKNOWN_DATASET_VERSION && (
        config.contentSource === "database" || version.datasetVersion === this.datasetVersion
      );
    } catch {
      return false;
    }
  }

  checkAuth(): boolean {
    return Boolean(config.betterAuthSecret && config.betterAuthUrl);
  }

}

/** Singleton del composition root. */
export const compositionRoot = new CompositionRoot();
