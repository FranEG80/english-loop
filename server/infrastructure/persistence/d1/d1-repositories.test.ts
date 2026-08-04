import { describe, expect, it } from "vitest";
import { UserSettings } from "@/core/account/domain/user-settings";
import { SavedLesson } from "@/core/account/domain/saved-lesson";
import { DailySession } from "@/core/learning/domain/daily-session";
import { PracticeRun } from "@/core/practice/domain/practice-run";
import { ActivityAttempt } from "@/core/practice/domain/activity-attempt";
import { ReviewItem } from "@/core/progress/domain/review-item";
import type { D1Result } from "./types/binding";
import type { D1Operation } from "./types/operations";
import { D1SavedLessonRepository, D1UserSettingsRepository } from "./d1-account-repositories";
import { D1DailySessionRepository, D1LessonProgressRepository } from "./d1-learning-repositories";
import { D1AttemptRepository, D1PracticeRunRepository } from "./d1-practice-repositories";
import { D1ProgressRepository, D1ReviewRepository } from "./d1-progress-repositories";

type Row = Record<string, unknown>;

function result(results: Row[] = []): D1Result {
  return { success: true, results };
}

function transport(responses: Partial<Record<D1Operation["name"], D1Result>> = {}) {
  const calls: D1Operation[] = [];
  return {
    calls,
    execute: async (request: D1Operation) => {
      calls.push(request);
      return responses[request.name] ?? result();
    },
    batch: async () => [],
  };
}

const now = "2026-08-04T00:00:00.000Z";

describe("D1 account repositories", () => {
  it("maps settings and saved lessons and forwards writes", async () => {
    const base = transport({
      userSettingsGet: result([{ userId: "u1", locale: "en", activeLevels: "[\"B1\",\"B2\"]", dailyGoalLessons: 2, dailyGoalActivities: 15, timezone: "Europe/Madrid", reducedMotion: 1 }]),
      savedLessonsList: result([{ userId: "u1", lessonId: "l1", savedAt: now }]),
      savedLessonGet: result([]),
    });
    const settings = new D1UserSettingsRepository(base);
    const saved = new D1SavedLessonRepository(base);

    await expect(settings.findByUserId("u1")).resolves.toMatchObject({ userId: "u1", activeLevels: ["B1", "B2"], reducedMotion: true });
    await settings.save(UserSettings.defaults("u1"));
    await expect(saved.findByUserId("u1")).resolves.toHaveLength(1);
    await expect(saved.findByUserAndLesson("u1", "missing")).resolves.toBeNull();
    await saved.save(SavedLesson.create({ userId: "u1", lessonId: "l2", savedAt: now }));
    await saved.delete("u1", "l2");
    expect(base.calls.map(({ name }) => name)).toEqual([
      "userSettingsGet", "userSettingsSave", "savedLessonsList", "savedLessonGet", "savedLessonSave", "savedLessonDelete",
    ]);
  });

  it("returns null for missing settings", async () => {
    const base = transport({ userSettingsGet: result([]) });
    await expect(new D1UserSettingsRepository(base).findByUserId("missing")).resolves.toBeNull();
  });
});

describe("D1 learning repositories", () => {
  it("maps session rows, including rows without a lesson, and progress", async () => {
    const base = transport({
      dailySessionGetById: result([
        { id: "s1", userId: "u1", date: "2026-08-04", status: "lesson", datasetVersion: "v1", seed: "seed", practiceRunId: null, createdAt: now, lessonId: "l1", lessonOrder: 0, lessonStatus: "pending", selectionReason: "new", completedAt: null },
        { id: "s1", userId: "u1", date: "2026-08-04", status: "lesson", datasetVersion: "v1", seed: "seed", practiceRunId: null, createdAt: now, lessonId: null },
      ]),
      dailySessionGetByUserDate: result([]),
      dailySessionGetByPracticeRun: result([]),
      lessonProgressList: result([{ userId: "u1", lessonId: "l1", viewed: "1", viewedAt: now, errorsPending: 0 }, { userId: "u1", lessonId: "l2", viewed: 0, viewedAt: null, errorsPending: 2 }]),
    });
    const sessions = new D1DailySessionRepository(base);
    const progress = new D1LessonProgressRepository(base);

    await expect(sessions.findById("s1")).resolves.toMatchObject({ id: "s1", lessons: [{ lessonId: "l1" }] });
    await expect(sessions.findByUserIdAndDate("u1", "2026-08-04")).resolves.toBeNull();
    await expect(sessions.findByPracticeRunId("r1")).resolves.toBeNull();
    await sessions.save(DailySession.create({ id: "s1", userId: "u1", date: "2026-08-04", status: "lesson", datasetVersion: "v1", seed: "seed", practiceRunId: null, createdAt: now, lessons: [] }));
    await expect(progress.findByUserId("u1")).resolves.toMatchObject([{ viewed: true, viewedAt: now }, { viewed: false, viewedAt: null }]);
    await progress.upsert({ userId: "u1", lessonId: "l1", viewed: true, viewedAt: now, errorsPending: 0 });
    expect(base.calls.map(({ name }) => name)).toContain("dailySessionSave");
  });
});

describe("D1 practice repositories", () => {
  it("maps runs, attempts, repetitions and immutable attempt writes", async () => {
    const base = transport({
      practiceRunGet: result([
        { id: "r1", userId: "u1", mode: "FOCUSED", status: "in_progress", scopeSnapshot: JSON.stringify({ level: "B1", taxonomyNodeId: "n1", taxonomyPath: [], descendantIds: ["n1"], requestedCount: 1 }), currentIndex: 0, originalActivityCount: 1, datasetVersion: "v1", createdAt: now, position: 0, activityId: "a1", isRepetition: 0 },
        { id: "r1", userId: "u1", mode: "FOCUSED", status: "in_progress", scopeSnapshot: JSON.stringify({ level: "B1", taxonomyNodeId: "n1", taxonomyPath: [], descendantIds: ["n1"], requestedCount: 1 }), currentIndex: 0, originalActivityCount: 1, datasetVersion: "v1", createdAt: now, position: 1, activityId: "a2", isRepetition: 1 },
      ]),
      attemptGetByIdempotency: result([]),
      attemptsGetByRun: result([{ id: "at1", userId: "u1", practiceRunId: "r1", activityId: "a1", activityVersionId: null, practiceRunItemId: null, origin: "FOCUSED", idempotencyKey: "k", response: JSON.stringify({ kind: "boolean", value: true }), isCorrect: 1, isRepetition: 0, evaluatorVersion: "v1", submittedAt: now }]),
      attemptsGetByUserActivity: result([]),
    });
    const runs = new D1PracticeRunRepository(base);
    const attempts = new D1AttemptRepository(base);
    const run = PracticeRun.create({ id: "r1", userId: "u1", mode: "FOCUSED", scope: { level: "B1", taxonomyNodeId: "n1", taxonomyPath: [], descendantIds: ["n1"], requestedCount: 1 }, activityIds: ["a1", "a2"], repetitionActivityIds: ["a2"], originalActivityCount: 1, currentIndex: 0, status: "in_progress", datasetVersion: "v1", dailySessionId: null, createdAt: now });

    await expect(runs.findById("r1")).resolves.toMatchObject({ id: "r1", activityIds: ["a1", "a2"], repetitionActivityIds: ["a2"] });
    await runs.save(run);
    await expect(attempts.findByUserIdAndIdempotencyKey("u1", "missing")).resolves.toBeNull();
    await expect(attempts.findByPracticeRunId("r1")).resolves.toHaveLength(1);
    await expect(attempts.findByUserIdAndActivityId("u1", "a1")).resolves.toHaveLength(0);
    await attempts.save(ActivityAttempt.create({ id: "at2", userId: "u1", practiceRunId: "r1", activityId: "a1", activityVersionId: null, practiceRunItemId: null, origin: "FOCUSED", idempotencyKey: "k2", response: { kind: "boolean", value: false }, isCorrect: false, isRepetition: true, evaluatorVersion: "v1", submittedAt: now }));
  });
});

describe("D1 progress and review repositories", () => {
  it("projects progress strength and weakness and maps review items", async () => {
    const reviewRow = { id: "rv1", userId: "u1", activityId: "a1", activityVersionId: null, lessonId: null, taxonomyNodeId: "n1", level: "B1", stage: 1, consecutiveCorrect: 0, dueAt: now, failedAt: now, resolvedAt: null, attemptsCount: 1 };
    const base = transport({
      activityProgressGet: result([]), taxonomyProgressGet: result([]),
      progressOverview: result([
        { kind: "activity", itemId: "a1", attemptsCount: 2, correctCount: 2, lastResult: 1, lastAttemptAt: now },
        { kind: "taxonomy", itemId: "strong", attemptsCount: 5, correctCount: 4 },
        { kind: "taxonomy", itemId: "weak", attemptsCount: 5, correctCount: 2 },
        { kind: "taxonomy", itemId: "empty", attemptsCount: 0, correctCount: 0 },
        { kind: "taxonomy", itemId: "middle", attemptsCount: 2, correctCount: 1 },
      ]),
      reviewGetByActivity: result(reviewRow ? [reviewRow] : []), reviewGetDue: result([]), reviewGetUpcoming: result([]),
    });
    const progress = new D1ProgressRepository(base);
    const reviews = new D1ReviewRepository(base);

    await expect(progress.getActivityProgress("u1", "a1")).resolves.toBeNull();
    await progress.upsertActivityProgress({ userId: "u1", activityId: "a1", attemptsCount: 1, correctCount: 1, lastResult: null, lastAttemptAt: null });
    await expect(progress.getTaxonomyProgress("u1", "n1")).resolves.toBeNull();
    await progress.upsertTaxonomyProgress({ userId: "u1", taxonomyNodeId: "n1", attemptsCount: 1, correctCount: 1 });
    await expect(progress.getOverview("u1")).resolves.toMatchObject({ totalActivitiesCompleted: 1, strongTopicIds: ["strong"], weakTopicIds: ["weak"] });
    await expect(reviews.findByUserIdAndActivity("u1", "a1")).resolves.toMatchObject({ id: "rv1" });
    await expect(reviews.findDueByUserId("u1", now)).resolves.toHaveLength(0);
    await expect(reviews.findUpcomingByUserId("u1", now)).resolves.toHaveLength(0);
    await reviews.save(ReviewItem.create({ id: "rv1", userId: "u1", activityId: "a1", taxonomyNodeId: "n1", level: "B1", stage: 1, consecutiveCorrect: 0, dueAt: now, failedAt: now, resolvedAt: null, attemptsCount: 1 }));
  });
});
