// @vitest-environment node
import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaUnitOfWorkAdapter } from "../database/prisma-unit-of-work-adapter";
import { PrismaAttemptRepository } from "./prisma-attempt-repository";
import { PrismaDailySessionRepository } from "./prisma-daily-session-repository";
import { PrismaLessonProgressRepository } from "./prisma-lesson-progress-repository";
import { PrismaPracticeRunRepository } from "./prisma-practice-run-repository";
import { PrismaProgressRepository } from "./prisma-progress-repository";
import { PrismaReviewRepository } from "./prisma-review-repository";
import { PrismaSavedLessonRepository } from "./prisma-saved-lesson-repository";
import { PrismaUserSettingsRepository } from "./prisma-user-settings-repository";
import { UserSettings } from "@/core/account/domain/user-settings";
import { SavedLesson } from "@/core/account/domain/saved-lesson";
import { DailySession } from "@/core/learning/domain/daily-session";
import { PracticeRun } from "@/core/practice/domain/practice-run";
import { ActivityAttempt } from "@/core/practice/domain/activity-attempt";
import { ReviewItem } from "@/core/progress/domain/review-item";

const enabled = process.env.RUN_DB_INTEGRATION === "1";
const describeDatabase = enabled ? describe : describe.skip;

describeDatabase("Prisma repository contracts on SQLite", () => {
  let prisma: PrismaClient;
  let userId: string;

  beforeAll(async () => {
    prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: process.env.TEST_DATABASE_URL ?? "file:./test-repositories.db" }) });
    await prisma.rateLimitBucket.deleteMany();
    await prisma.activityAttempt.deleteMany();
    await prisma.dailySessionLesson.deleteMany();
    await prisma.dailySession.deleteMany();
    await prisma.practiceRun.deleteMany();
    await prisma.reviewItem.deleteMany();
    await prisma.taxonomyProgress.deleteMany();
    await prisma.userActivityProgress.deleteMany();
    await prisma.userLessonProgress.deleteMany();
    await prisma.savedLesson.deleteMany();
    await prisma.userSettings.deleteMany();
    await prisma.session.deleteMany();
    await prisma.account.deleteMany();
    await prisma.verification.deleteMany();
    await prisma.user.deleteMany();
    userId = "integration-user";
    await prisma.user.create({ data: { id: userId, name: "Integration", email: "integration@example.com" } });
  });

  afterAll(async () => prisma.$disconnect());

  it("covers CRUD/upsert and user isolation across repositories", async () => {
    const settings = new PrismaUserSettingsRepository(prisma);
    const saved = new PrismaSavedLessonRepository(prisma);
    const lessons = new PrismaLessonProgressRepository(prisma);
    const sessions = new PrismaDailySessionRepository(prisma);
    const runs = new PrismaPracticeRunRepository(prisma);
    const attempts = new PrismaAttemptRepository(prisma);
    const progress = new PrismaProgressRepository(prisma);
    const reviews = new PrismaReviewRepository(prisma);

    await settings.save(UserSettings.defaults(userId));
    expect((await settings.findByUserId(userId))?.userId).toBe(userId);
    await saved.save(SavedLesson.create({ userId, lessonId: "lesson-1", savedAt: "2026-08-03T00:00:00.000Z" }));
    expect(await saved.findByUserId(userId)).toHaveLength(1);
    expect(await saved.findByUserAndLesson(userId, "lesson-1")).not.toBeNull();
    expect(await saved.findByUserAndLesson(userId, "missing-lesson")).toBeNull();
    await saved.delete(userId, "lesson-1");
    expect(await saved.findByUserId(userId)).toHaveLength(0);
    await saved.save(SavedLesson.create({ userId, lessonId: "lesson-1", savedAt: "2026-08-03T00:00:00.000Z" }));
    await lessons.upsert({ userId, lessonId: "lesson-1", viewed: true, viewedAt: "2026-08-03T00:00:00.000Z", errorsPending: 0 });
    expect((await lessons.findByUserId(userId))[0]?.viewed).toBe(true);
    const session = DailySession.create({ id: "session-integration", userId, date: "2026-08-03", status: "lesson", datasetVersion: "v1", seed: "seed", lessons: [{ lessonId: "lesson-1", order: 0, status: "pending", selectionReason: "new", completedAt: null }], practiceRunId: null, createdAt: "2026-08-03T00:00:00.000Z" });
    await sessions.save(session);
    expect((await sessions.findByUserIdAndDate(userId, "2026-08-03"))?.id).toBe(session.id);
    const run = PracticeRun.create({ id: "run-integration", userId, mode: "FOCUSED", scope: { level: "B1", taxonomyNodeId: "topic", taxonomyPath: [], descendantIds: ["topic"], requestedCount: 1 }, activityIds: ["activity-1"], currentIndex: 0, status: "in_progress", datasetVersion: "v1", dailySessionId: null, createdAt: "2026-08-03T00:00:00.000Z" });
    await runs.save(run);
    await attempts.save(ActivityAttempt.create({ id: "attempt-integration", userId, practiceRunId: run.id, activityId: "activity-1", origin: "FOCUSED", idempotencyKey: "key", response: { kind: "boolean", value: true }, isCorrect: true, evaluatorVersion: "1", submittedAt: "2026-08-03T00:00:00.000Z" }));
    expect(await attempts.findByUserIdAndActivityId(userId, "activity-1")).toHaveLength(1);
    await progress.upsertActivityProgress({ userId, activityId: "activity-1", attemptsCount: 1, correctCount: 1, lastResult: true, lastAttemptAt: "2026-08-03T00:00:00.000Z" });
    await progress.upsertTaxonomyProgress({ userId, taxonomyNodeId: "topic", attemptsCount: 1, correctCount: 1 });
    expect((await progress.getActivityProgress(userId, "activity-1"))?.correctCount).toBe(1);
    await reviews.save(ReviewItem.create({ id: "review-integration", userId, activityId: "activity-1", taxonomyNodeId: "topic", level: "B1", stage: 0, consecutiveCorrect: 0, dueAt: "2026-08-03T00:00:00.000Z", failedAt: "2026-08-03T00:00:00.000Z", resolvedAt: null, attemptsCount: 1 }));
    expect(await reviews.findDueByUserId(userId, "2026-08-04T00:00:00.000Z")).toHaveLength(1);
    expect(await settings.findByUserId("other-user")).toBeNull();
  });

  it("rolls back writes made through the real transaction client", async () => {
    const unitOfWork = new PrismaUnitOfWorkAdapter(prisma);
    const settings = new PrismaUserSettingsRepository(prisma);
    await prisma.userSettings.deleteMany({ where: { userId } });
    await expect(unitOfWork.transaction(async () => {
      await settings.save(UserSettings.defaults(userId));
      throw new Error("force rollback");
    })).rejects.toMatchObject({ message: "force rollback" });
    await prisma.userSettings.deleteMany({ where: { userId } });
    expect(await settings.findByUserId(userId)).toBeNull();
  });
});
