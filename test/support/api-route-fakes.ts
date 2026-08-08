import { PracticeRunPlanner } from "@/core/practice/domain/practice-run-planner";
import { paginateSortedItems } from "@/core/shared/kernel";
import {
  matchesCatalogSearch,
  numberedPage,
} from "@/core/content/domain/catalog-search";
import type { ActivityListFilters, LessonListFilters } from "@/core/content/ports/catalog-ports";
import { DailyPracticePlanner } from "@/core/learning/domain/daily-practice-planner";
import { DailySessionPlanner } from "@/core/learning/domain/daily-session-planner";
import {
  activity as makeActivity,
  catalog as baseCatalog,
  clock,
  identity,
  ids,
  lesson,
  MemoryAttempts,
  MemoryProgress,
  MemoryReviews,
  MemoryRuns,
  MemorySavedLessons,
  MemorySessions,
  MemorySettings,
  random,
  taxonomy,
  uow,
} from "./core-fakes";

function createActivityCatalog() {
  const activities = Array.from({ length: 8 }, (_, index) =>
    makeActivity(`activity-${index + 1}`),
  );

  return {
    ...baseCatalog,
    async listActivities(filters?: { level?: string; lessonIds?: string[] }) {
      return activities.filter(
        (item) =>
          (!filters?.level || filters.level === "both" || item.level === filters.level) &&
          (!filters?.lessonIds || item.lessonIds.some((id) => filters.lessonIds?.includes(id))),
      );
    },
    async listLessonsPage(filters: LessonListFilters | undefined, pagination: { cursor?: string; limit: number }) {
      const lessons = await this.listLessons(filters);
      return paginateSortedItems([...lessons].sort((left, right) => left.id.localeCompare(right.id)), pagination, (item) => item.id);
    },
    async searchLessonsPage(filters: LessonListFilters | undefined, pagination: { page: number; pageSize: number }) {
      const lessons = (await this.listLessons(filters)).filter((item) =>
        matchesCatalogSearch(
          [item.id, item.title, item.summary, item.category, item.taxonomyNodeId, ...item.tags],
          filters?.query,
        ),
      );
      const start = (pagination.page - 1) * pagination.pageSize;
      return numberedPage(lessons.slice(start, start + pagination.pageSize), lessons.length, pagination.page, pagination.pageSize);
    },
    async listActivitiesPage(filters: ActivityListFilters | undefined, pagination: { cursor?: string; limit: number }) {
      const listed = await this.listActivities(filters);
      return paginateSortedItems([...listed].sort((left, right) => left.id.localeCompare(right.id)), pagination, (item) => item.id);
    },
    async searchActivitiesPage(filters: ActivityListFilters | undefined, pagination: { page: number; pageSize: number }) {
      const listed = (await this.listActivities(filters)).filter((item) =>
        (!filters?.taxonomyNodeIds || item.taxonomyNodeIds.some((id) => filters.taxonomyNodeIds?.includes(id))) &&
        (!filters?.activityType || item.type === filters.activityType) &&
        (!filters?.presentation || filters.presentation === "choice") &&
        matchesCatalogSearch(
          [item.id, item.type, item.category, item.topic, item.subtopic, ...item.taxonomyNodeIds],
          filters?.query,
        ),
      );
      const start = (pagination.page - 1) * pagination.pageSize;
      return numberedPage(listed.slice(start, start + pagination.pageSize), listed.length, pagination.page, pagination.pageSize);
    },
    async getActivityById(id: string) {
      return activities.find((item) => item.id === id) ?? null;
    },
    async countActivitiesByNode(nodeId: string, level?: string) {
      return (await this.listActivities({ level })).filter((item) =>
        item.taxonomyNodeIds.includes(nodeId),
      ).length;
    },
    async countActivitiesByNodes(nodeIds: string[], level?: string) {
      return (await this.listActivities({ level })).filter((item) =>
        item.taxonomyNodeIds.some((id) => nodeIds.includes(id)),
      ).length;
    },
  };
}

export function createApiRouteRoot() {
  const activityCatalog = createActivityCatalog();
  const sessions = new MemorySessions();
  const runs = new MemoryRuns();
  const attempts = new MemoryAttempts();
  const progress = new MemoryProgress();
  const reviews = new MemoryReviews();
  const savedLessons = new MemorySavedLessons();
  const settings = new MemorySettings();
  const events: Array<{ eventName: string }> = [];
  const dispatcher = {
    dispatch: async (items: Array<{ eventName: string }>) => {
      events.push(...items);
    },
  };
  const limiter = { isLimited: async () => false };
  const idGenerator = { generate: () => ids.generate() };

  const root = {
    unitOfWork: uow,
    identity,
    userSettingsRepository: settings,
    savedLessonRepository: savedLessons,
    attemptRepository: attempts,
    practiceRunRepository: runs,
    progressRepository: progress,
    reviewRepository: reviews,
    dailySessionRepository: sessions,
    lessonProgressRepository: {
      findByUserId: async () => [],
      upsert: async () => undefined,
    },
    randomSource: random,
    clock,
    logger: { error: () => undefined },
    idGenerator,
    domainEventDispatcher: dispatcher,
    attemptRateLimiter: limiter,
    authRateLimiter: limiter,
    practiceRunPlanner: new PracticeRunPlanner(random),
    dailySessionPlanner: new DailySessionPlanner(random),
    dailyPracticePlanner: new DailyPracticePlanner(random),
    getActivityCatalog: () => activityCatalog,
    getLessonCatalog: () => activityCatalog,
    getTaxonomyCatalog: () => taxonomy,
    getDatasetVersion: async () => "v1",
    checkDatabase: async () => true,
    checkCatalog: async () => true,
    checkAuth: () => true,
  };

  return {
    root,
    state: {
      activityCatalog,
      sessions,
      runs,
      attempts,
      progress,
      reviews,
      savedLessons,
      settings,
      events,
      lesson,
    },
  };
}
