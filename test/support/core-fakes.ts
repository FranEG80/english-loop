import type { Actor, IdentityPort } from "@/core/account/ports/identity-port";
import type { UserSettingsRepository } from "@/core/account/ports/user-settings-repository";
import type { SavedLessonRepository } from "@/core/account/ports/saved-lesson-repository";
import type { SavedLesson } from "@/core/account/domain/saved-lesson";
import { UserSettings } from "@/core/account/domain/user-settings";
import type { Lesson } from "@/core/content/domain/types/lesson";
import type { Activity } from "@/core/content/domain/types/activity";
import type { ActivityCatalogPort, LessonCatalogPort, TaxonomyCatalogPort } from "@/core/content/ports/catalog-ports";
import type { ContentVersion } from "@/core/content/domain/content-version";
import type { TaxonomyNode } from "@/core/content/domain/types/taxonomy";
import type { DailySessionRepository } from "@/core/learning/ports/daily-session-repository";
import type { LessonProgressRecord, LessonProgressRepository } from "@/core/learning/ports/lesson-progress-repository";
import { DailySession } from "@/core/learning/domain/daily-session";
import type { PracticeRunRepository } from "@/core/practice/ports/practice-run-repository";
import type { ActivityAttempt } from "@/core/practice/domain/activity-attempt";
import type { AttemptRepository } from "@/core/practice/ports/attempt-repository";
import { PracticeRun } from "@/core/practice/domain/practice-run";
import type { ProgressRepository, ActivityProgressRecord, TaxonomyProgressRecord } from "@/core/progress/ports/progress-repository";
import type { ReviewRepository } from "@/core/progress/ports/review-repository";
import type { ReviewItem } from "@/core/progress/domain/review-item";
import type { DomainEvent, UnitOfWorkPort } from "@/core/shared/kernel";

export const actor: Actor = { userId: "user-1", name: "Test", email: "test@example.com", activeLevels: ["B1", "B2"] };
export const identity: IdentityPort = { getActor: async () => actor, requireActor: async () => actor };
export const clock = { now: () => new Date("2026-08-03T22:00:00.000Z"), nowIso: () => "2026-08-03T22:00:00.000Z" };
export const random = { int: (max: number) => { void max; return 0; }, float: () => 0, shuffle: <T>(items: readonly T[]) => [...items] };
export const uow: UnitOfWorkPort = { transaction: async (work) => work() };
let nextId = 0;
export const ids = { generate: () => `id-${++nextId}` };

export const lesson: Lesson = {
  id: "lesson-1", level: "B1", category: "grammar", taxonomyNodeId: "topic",
  prerequisiteLessonIds: [],
  title: "Lesson", summary: "Summary", explanation: "Explanation", examples: [],
  commonMistakes: [], relatedActivityIds: ["activity-1", "activity-2"], tags: [],
  difficulty: 1, status: "published", contentVersion: 1,
};

export function activity(id: string, taxonomyNodeIds = ["root", "topic"]): Activity {
  return {
    id, level: "B1", type: "true_false", category: "grammar", topic: "topic", subtopic: "topic",
    taxonomyNodeIds, difficulty: 1, instructions: "Choose", prompt: "True?", lessonIds: [lesson.id],
    tags: [], estimatedSeconds: 10, evaluator: { strategy: "boolean", correct: true },
    explanation: "Because", status: "published",
  };
}

export class MemorySettings implements UserSettingsRepository {
  value: UserSettings | null = null;
  async findByUserId() { return this.value; }
  async save(value: UserSettings) { this.value = value; }
}

export class MemorySavedLessons implements SavedLessonRepository {
  values: SavedLesson[] = [];
  async findByUserId(userId: string) { return this.values.filter((item) => item.userId === userId); }
  async findByUserAndLesson(userId: string, lessonId: string) { return this.values.find((item) => item.userId === userId && item.lessonId === lessonId) ?? null; }
  async save(value: SavedLesson) { if (!await this.findByUserAndLesson(value.userId, value.lessonId)) this.values.push(value); }
  async delete(userId: string, lessonId: string) { this.values = this.values.filter((item) => !(item.userId === userId && item.lessonId === lessonId)); }
}

export class MemorySessions implements DailySessionRepository {
  values = new Map<string, DailySession>();
  async findById(id: string) { return this.values.get(id) ?? null; }
  async findByUserIdAndDate(userId: string, date: string) { return [...this.values.values()].find((item) => item.userId === userId && item.date === date) ?? null; }
  async findByPracticeRunId(runId: string) { return [...this.values.values()].find((item) => item.practiceRunId === runId) ?? null; }
  async save(value: DailySession) { this.values.set(value.id, value); }
}

export class MemoryProgress implements ProgressRepository {
  activityValues = new Map<string, ActivityProgressRecord>();
  taxonomyValues = new Map<string, TaxonomyProgressRecord>();
  async getActivityProgress(userId: string, activityId: string) { return this.activityValues.get(`${userId}:${activityId}`) ?? null; }
  async upsertActivityProgress(value: ActivityProgressRecord) { this.activityValues.set(`${value.userId}:${value.activityId}`, value); }
  async getTaxonomyProgress(userId: string, taxonomyNodeId: string) { return this.taxonomyValues.get(`${userId}:${taxonomyNodeId}`) ?? null; }
  async upsertTaxonomyProgress(value: TaxonomyProgressRecord) { this.taxonomyValues.set(`${value.userId}:${value.taxonomyNodeId}`, value); }
  async getOverview(userId: string) {
    const values = [...this.activityValues.values()].filter((item) => item.userId === userId);
    return { totalActivitiesCompleted: values.length, totalCorrect: values.reduce((sum, item) => sum + item.correctCount, 0), totalAttempts: values.reduce((sum, item) => sum + item.attemptsCount, 0), strongTopicIds: [], weakTopicIds: [] };
  }
}

export class MemoryReviews implements ReviewRepository {
  values = new Map<string, ReviewItem>();
  async findByUserIdAndActivity(userId: string, activityId: string) { return this.values.get(`${userId}:${activityId}`) ?? null; }
  async findDueByUserId() { return []; }
  async findUpcomingByUserId() { return []; }
  async save(value: ReviewItem) { this.values.set(`${value.userId}:${value.activityId}`, value); }
}

export class MemoryAttempts implements AttemptRepository {
  values: ActivityAttempt[] = [];
  async findByUserIdAndIdempotencyKey(userId: string, key: string) { return this.values.find((item) => item.userId === userId && item.idempotencyKey === key) ?? null; }
  async findByPracticeRunId(runId: string) { return this.values.filter((item) => item.practiceRunId === runId); }
  async findByUserIdAndActivityId(userId: string, activityId: string) { return this.values.filter((item) => item.userId === userId && item.activityId === activityId); }
  async save(value: ActivityAttempt) { this.values.push(value); }
}

export class MemoryRuns implements PracticeRunRepository {
  values = new Map<string, PracticeRun>();
  async findById(id: string) { return this.values.get(id) ?? null; }
  async save(value: PracticeRun) { this.values.set(value.id, value); }
}

export const catalog: ActivityCatalogPort & LessonCatalogPort = {
  async listLessons(filters) { return filters?.level ? [lesson].filter((item) => item.level === filters.level) : [lesson]; },
  async getLessonById(id) { return id === lesson.id ? lesson : null; },
  async listActivities(filters) {
    return [activity("activity-1"), activity("activity-2")].filter((item) =>
      (!filters?.level || filters.level === "both" || item.level === filters.level) &&
      (!filters?.lessonIds || item.lessonIds.some((id) => filters.lessonIds?.includes(id))),
    );
  },
  async getActivityById(id) { return [activity("activity-1"), activity("activity-2")].find((item) => item.id === id) ?? null; },
  async getActivityByVersionId(versionId) { return [activity("activity-1"), activity("activity-2")].find((item) => item.versionId === versionId) ?? null; },
  async countActivitiesByNode(nodeId, level) { return this.countActivitiesByNodes([nodeId], level); },
  async countActivitiesByNodes(nodeIds, level) { return (await this.listActivities({ level })).filter((item) => item.taxonomyNodeIds.some((id) => nodeIds.includes(id))).length; },
};

export const taxonomy: TaxonomyCatalogPort = {
  async getTaxonomyTree() { return []; },
  async resolveNodeWithDescendants(nodeId) { return [{ id: nodeId, parentId: null, kind: "topic", labels: { en: nodeId, es: nodeId }, levels: ["B1"], selectableForPractice: true, order: 0, children: [] } satisfies TaxonomyNode]; },
  async getNodePath(nodeId) { return [{ id: "root", parentId: null, kind: "category", labels: { en: "Root", es: "Root" }, levels: ["B1"], selectableForPractice: true, order: 0, children: [] }, { id: nodeId, parentId: "root", kind: "topic", labels: { en: nodeId, es: nodeId }, levels: ["B1"], selectableForPractice: true, order: 0, children: [] }]; },
  async getContentVersion(): Promise<ContentVersion> { return { datasetVersion: "v1", schemaVersion: "1.0.0" }; },
};

export function makeDailySession(id = "session-1", status: "lesson" | "practice" = "lesson") {
  return DailySession.create({ id, userId: actor.userId, date: "2026-08-04", status, datasetVersion: "v1", seed: "seed", lessons: [{ lessonId: lesson.id, order: 0, status: status === "practice" ? "completed" : "pending", selectionReason: "new", completedAt: status === "practice" ? clock.nowIso() : null }], practiceRunId: null, createdAt: clock.nowIso() });
}

export function makeDailyRun(sessionId: string, id = "run-1") {
  return PracticeRun.create({ id, userId: actor.userId, mode: "DAILY", scope: { level: "B1", taxonomyNodeId: "daily", taxonomyPath: [], descendantIds: [], requestedCount: 2 }, activityIds: ["activity-1", "activity-2"], currentIndex: 0, status: "in_progress", datasetVersion: "v1", dailySessionId: sessionId, createdAt: clock.nowIso() });
}

export function collectEvents() {
  const events: DomainEvent[] = [];
  return { events, dispatcher: { dispatch: async (items: DomainEvent[]) => { events.push(...items); } } };
}

export const lessonProgress: LessonProgressRepository = { findByUserId: async () => [], upsert: async (record: LessonProgressRecord) => { void record; } };
