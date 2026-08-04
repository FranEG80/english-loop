import "server-only";
import type { PrismaClient } from "@/generated/prisma/client";
import type { UserSettingsRepository } from "@/core/account/ports/user-settings-repository";
import type { SavedLessonRepository } from "@/core/account/ports/saved-lesson-repository";
import type { DailySessionRepository } from "@/core/learning/ports/daily-session-repository";
import type { LessonProgressRepository } from "@/core/learning/ports/lesson-progress-repository";
import type { AttemptRepository } from "@/core/practice/ports/attempt-repository";
import type { PracticeRunRepository } from "@/core/practice/ports/practice-run-repository";
import type { ProgressRepository } from "@/core/progress/ports/progress-repository";
import type { ReviewRepository } from "@/core/progress/ports/review-repository";
import type { UnitOfWorkPort } from "@/core/shared/kernel";
import type { RateLimiterPort } from "@/core/shared/kernel";
import type { ActivityCatalogPagePort, ActivityCatalogPort, CatalogMetadataPort, LessonCatalogPagePort, LessonCatalogPort, TaxonomyCatalogPort } from "@/core/content/ports/catalog-ports";
import type { CatalogWritePort } from "@/core/content/ports/catalog-write-port";
import { PrismaUnitOfWorkAdapter } from "../database/prisma-unit-of-work-adapter";
import { PrismaUserSettingsRepository } from "./prisma-user-settings-repository";
import { PrismaSavedLessonRepository } from "./prisma-saved-lesson-repository";
import { PrismaAttemptRepository } from "./prisma-attempt-repository";
import { PrismaPracticeRunRepository } from "./prisma-practice-run-repository";
import { PrismaProgressRepository } from "./prisma-progress-repository";
import { PrismaReviewRepository } from "./prisma-review-repository";
import { PrismaDailySessionRepository } from "./prisma-daily-session-repository";
import { PrismaLessonProgressRepository } from "./prisma-lesson-progress-repository";
import { PrismaCatalogAdapter } from "@/adapters/content/prisma-catalog-adapter";
import { D1CatalogAdapter } from "./d1/d1-catalog-adapter";
import { D1AttemptRepository, D1PracticeRunRepository } from "./d1/d1-practice-repositories";
import { D1DailySessionRepository, D1LessonProgressRepository } from "./d1/d1-learning-repositories";
import { D1ProgressRepository, D1ReviewRepository } from "./d1/d1-progress-repositories";
import { D1SavedLessonRepository, D1UserSettingsRepository } from "./d1/d1-account-repositories";
import { D1UnitOfWorkAdapter } from "./d1/d1-unit-of-work-adapter";
import { D1TransactionCoordinator } from "./d1/d1-transaction-coordinator";
import { createD1Transport, type D1RuntimeOptions } from "./d1/d1-runtime";
import { D1RateLimiter } from "../security/d1-rate-limiter";
import { D1CatalogWriteAdapter, D1HttpCatalogWriteAdapter } from "./d1/catalog-write";
import type { AppConfig } from "../config/config";

export interface PersistenceBundle {
  unitOfWork: UnitOfWorkPort;
  userSettingsRepository: UserSettingsRepository;
  savedLessonRepository: SavedLessonRepository;
  attemptRepository: AttemptRepository;
  practiceRunRepository: PracticeRunRepository;
  progressRepository: ProgressRepository;
  reviewRepository: ReviewRepository;
  dailySessionRepository: DailySessionRepository;
  lessonProgressRepository: LessonProgressRepository;
  lessonCatalog: LessonCatalogPort;
  activityCatalog: ActivityCatalogPort;
  taxonomyCatalog: TaxonomyCatalogPort;
  catalogMetadata: CatalogMetadataPort;
  databaseCatalog: LessonCatalogPort & LessonCatalogPagePort & ActivityCatalogPort & ActivityCatalogPagePort & TaxonomyCatalogPort & CatalogMetadataPort;
  catalogWritePort: CatalogWritePort | null;
  databaseHealth: () => Promise<boolean>;
  attemptRateLimiter: RateLimiterPort | null;
  authRateLimiter: RateLimiterPort | null;
}

export interface PersistenceBundleOptions {
  prisma: PrismaClient;
  config: Pick<AppConfig, "databaseProvider" | "d1Transport" | "d1HttpUrl" | "d1HttpToken" | "attemptRateLimitWindowMs" | "attemptRateLimitMax" | "authRateLimitWindowMs" | "authRateLimitMax" | "prismaTransactionRetryMax">;
  binding?: D1RuntimeOptions["binding"];
  fetch?: D1RuntimeOptions["fetch"];
  now?: D1RuntimeOptions["now"];
  nonce?: D1RuntimeOptions["nonce"];
}

export function createPersistenceBundle(options: PersistenceBundleOptions): PersistenceBundle {
  if (options.config.databaseProvider === "d1") {
    const transport = createD1Transport({ ...options.config, binding: options.binding, fetch: options.fetch, now: options.now, nonce: options.nonce });
    if (!transport) throw new Error("D1 persistence requires a configured D1 transport");
    const coordinator = new D1TransactionCoordinator(transport);
    const catalog = new D1CatalogAdapter(transport);
    return {
      unitOfWork: new D1UnitOfWorkAdapter(coordinator),
      userSettingsRepository: new D1UserSettingsRepository(coordinator),
      savedLessonRepository: new D1SavedLessonRepository(coordinator),
      attemptRepository: new D1AttemptRepository(coordinator),
      practiceRunRepository: new D1PracticeRunRepository(coordinator),
      progressRepository: new D1ProgressRepository(coordinator),
      reviewRepository: new D1ReviewRepository(coordinator),
      dailySessionRepository: new D1DailySessionRepository(coordinator),
      lessonProgressRepository: new D1LessonProgressRepository(coordinator),
      lessonCatalog: catalog,
      activityCatalog: catalog,
      taxonomyCatalog: catalog,
      catalogMetadata: catalog,
      databaseCatalog: catalog,
      catalogWritePort: options.binding?.DB
        ? new D1CatalogWriteAdapter(options.binding.DB)
        : options.config.d1HttpUrl && options.config.d1HttpToken
          ? new D1HttpCatalogWriteAdapter({ url: options.config.d1HttpUrl, token: options.config.d1HttpToken, fetch: options.fetch, now: options.now, nonce: options.nonce })
          : null,
      databaseHealth: async () => (await coordinator.execute({ name: "health" })).success,
      attemptRateLimiter: new D1RateLimiter(coordinator, options.config.attemptRateLimitWindowMs, options.config.attemptRateLimitMax),
      authRateLimiter: new D1RateLimiter(coordinator, options.config.authRateLimitWindowMs, options.config.authRateLimitMax),
    };
  }

  const catalog = new PrismaCatalogAdapter(options.prisma);
  return {
    unitOfWork: new PrismaUnitOfWorkAdapter(options.prisma, options.config.prismaTransactionRetryMax),
    userSettingsRepository: new PrismaUserSettingsRepository(options.prisma),
    savedLessonRepository: new PrismaSavedLessonRepository(options.prisma),
    attemptRepository: new PrismaAttemptRepository(options.prisma),
    practiceRunRepository: new PrismaPracticeRunRepository(options.prisma),
    progressRepository: new PrismaProgressRepository(options.prisma),
    reviewRepository: new PrismaReviewRepository(options.prisma),
    dailySessionRepository: new PrismaDailySessionRepository(options.prisma),
    lessonProgressRepository: new PrismaLessonProgressRepository(options.prisma),
    lessonCatalog: catalog,
    activityCatalog: catalog,
    taxonomyCatalog: catalog,
    catalogMetadata: catalog,
    databaseCatalog: catalog,
    catalogWritePort: null,
    databaseHealth: async () => {
      try {
        await options.prisma.$queryRaw`SELECT 1`;
        return true;
      } catch {
        return false;
      }
    },
    attemptRateLimiter: null,
    authRateLimiter: null,
  };
}
