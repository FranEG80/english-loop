import "server-only";
import { prisma } from "@/server/infrastructure/database/prisma-client";
import { BetterAuthIdentityAdapter } from "@/server/infrastructure/auth/better-auth-identity-adapter";
import { auth, createAuth, type AuthRuntimeOptions } from "@/server/infrastructure/auth/auth";
import { createPersistenceBundle, type PersistenceBundle } from "@/server/infrastructure/persistence/persistence-bundle";
import { FileLessonCatalogAdapter } from "@/adapters/content/file-lesson-catalog-adapter";
import { FileActivityCatalogAdapter } from "@/adapters/content/file-activity-catalog-adapter";
import { FileTaxonomyCatalogAdapter } from "@/adapters/content/file-taxonomy-catalog-adapter";
import { FileCatalogMetadataAdapter } from "@/adapters/content/file-catalog-metadata-adapter";
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
import type { RateLimiterPort, UnitOfWorkPort } from "@/core/shared/kernel";
import type { UserSettingsRepository } from "@/core/account/ports/user-settings-repository";
import type { SavedLessonRepository } from "@/core/account/ports/saved-lesson-repository";
import type { AttemptRepository } from "@/core/practice/ports/attempt-repository";
import type { PracticeRunRepository } from "@/core/practice/ports/practice-run-repository";
import type { ProgressRepository } from "@/core/progress/ports/progress-repository";
import type { ReviewRepository } from "@/core/progress/ports/review-repository";
import type { DailySessionRepository } from "@/core/learning/ports/daily-session-repository";
import type { LessonProgressRepository } from "@/core/learning/ports/lesson-progress-repository";
import type { D1RuntimeOptions } from "@/server/infrastructure/persistence/d1/d1-runtime";
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
  readonly unitOfWork: UnitOfWorkPort;
  readonly identity: BetterAuthIdentityAdapter;
  readonly userSettingsRepository: UserSettingsRepository;
  readonly savedLessonRepository: SavedLessonRepository;
  readonly attemptRepository: AttemptRepository;
  readonly practiceRunRepository: PracticeRunRepository;
  readonly progressRepository: ProgressRepository;
  readonly reviewRepository: ReviewRepository;
  readonly dailySessionRepository: DailySessionRepository;
  readonly lessonProgressRepository: LessonProgressRepository;
  readonly attemptRateLimiter: RateLimiterPort;
  readonly authRateLimiter: RateLimiterPort;
  readonly randomSource = new SystemRandomSource();
  readonly clock = new SystemClock();
  readonly logger = new StructuredLogger(this.clock);
  readonly domainEventDispatcher = new StructuredDomainEventDispatcher(
    this.logger,
  );
  readonly idGenerator = new UuidIdGenerator();
  readonly practiceRunPlanner = new PracticeRunPlanner(this.randomSource);
  readonly dailySessionPlanner = new DailySessionPlanner(this.randomSource);
  readonly dailyPracticePlanner = new DailyPracticePlanner(this.randomSource);

  private lessonCatalog: FileLessonCatalogAdapter | null = null;
  private activityCatalog: FileActivityCatalogAdapter | null = null;
  private taxonomyCatalog: FileTaxonomyCatalogAdapter | null = null;
  private catalogMetadata: FileCatalogMetadataAdapter | null = null;
  private databaseCatalog: LessonCatalogPort & ActivityCatalogPort & TaxonomyCatalogPort & CatalogMetadataPort | null = null;
  private readonly datasetVersion = readDatasetVersionSync();

  private readonly persistence: PersistenceBundle;

  constructor(options: Pick<D1RuntimeOptions, "binding" | "fetch" | "now" | "nonce"> = {}) {
    this.persistence = createPersistenceBundle({ prisma, config, ...options });
    this.unitOfWork = this.persistence.unitOfWork;
    const authClient = config.databaseProvider === "d1" && config.d1Transport === "binding"
      ? createAuth(options satisfies AuthRuntimeOptions)
      : auth;
    this.identity = new BetterAuthIdentityAdapter(authClient);
    this.userSettingsRepository = this.persistence.userSettingsRepository;
    this.savedLessonRepository = this.persistence.savedLessonRepository;
    this.attemptRepository = this.persistence.attemptRepository;
    this.practiceRunRepository = this.persistence.practiceRunRepository;
    this.progressRepository = this.persistence.progressRepository;
    this.reviewRepository = this.persistence.reviewRepository;
    this.dailySessionRepository = this.persistence.dailySessionRepository;
    this.lessonProgressRepository = this.persistence.lessonProgressRepository;
    this.databaseCatalog = this.persistence.databaseCatalog;
    this.attemptRateLimiter = this.persistence.attemptRateLimiter ?? (config.nodeEnv === "production"
      ? new PrismaRateLimiter(prisma, config.attemptRateLimitWindowMs, config.attemptRateLimitMax, this.clock)
      : new InMemoryRateLimiter(config.attemptRateLimitWindowMs, config.attemptRateLimitMax, this.clock));
    this.authRateLimiter = this.persistence.authRateLimiter ?? (config.nodeEnv === "production"
      ? new PrismaRateLimiter(prisma, config.authRateLimitWindowMs, config.authRateLimitMax, this.clock)
      : new InMemoryRateLimiter(config.authRateLimitWindowMs, config.authRateLimitMax, this.clock));
  }

  private getDatabaseCatalog(): LessonCatalogPort & ActivityCatalogPort & TaxonomyCatalogPort & CatalogMetadataPort {
    if (!this.databaseCatalog) this.databaseCatalog = this.persistence.databaseCatalog;
    return this.databaseCatalog;
  }

  getCatalogWritePort(): CatalogWritePort {
    if (config.databaseProvider === "d1") {
      if (!this.persistence.catalogWritePort) {
        throw new Error("D1 catalog seed requires the native DB binding; HTTP seed transport is not configured");
      }
      return this.persistence.catalogWritePort;
    }
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
    return this.persistence.databaseHealth();
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
