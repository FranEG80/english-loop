import type { LearningContentPort } from "@/core/ports";
import { mockLessons } from "./data/lessons";
import { mockActivities } from "./data/activities";
import {
  collectDescendantIds,
  findTaxonomyNode,
  mockTaxonomyTree,
} from "./data/taxonomy";
import {
  matchesCatalogSearch,
  numberedPage,
} from "@/core/content/domain/catalog-search";

function filterLessons(filters?: Parameters<LearningContentPort["listLessons"]>[0]) {
  return mockLessons.filter((lesson) => {
    if (filters?.category && lesson.category !== filters.category) return false;
    if (filters?.level && lesson.level !== filters.level) return false;
    return matchesCatalogSearch(
      [lesson.id, lesson.title, lesson.summary, lesson.category, lesson.taxonomyNodeId, ...lesson.tags],
      filters?.query,
    );
  });
}

function filterActivities(filters?: Parameters<LearningContentPort["listActivities"]>[0]) {
  return mockActivities.filter((activity) => {
    if (filters?.level && filters.level !== "both" && activity.level !== filters.level) return false;
    if (filters?.taxonomyNodeId) {
      const node = findTaxonomyNode(filters.taxonomyNodeId);
      const scopedIds = node
        ? new Set(collectDescendantIds(node))
        : new Set([filters.taxonomyNodeId]);
      if (!scopedIds.has(activity.taxonomyNodeId)) return false;
    }
    if (filters?.type && activity.type !== filters.type) return false;
    if (filters?.presentation && activity.presentation !== filters.presentation) return false;
    return matchesCatalogSearch(
      [activity.id, activity.type, activity.taxonomyNodeId],
      filters?.query,
    );
  });
}

export const learningContentMockAdapter: LearningContentPort = {
  async listLessons(filters) {
    return filterLessons(filters);
  },

  async searchLessonsPage(filters, pagination) {
    const lessons = filterLessons(filters);
    const start = (pagination.page - 1) * pagination.pageSize;
    return numberedPage(
      lessons.slice(start, start + pagination.pageSize),
      lessons.length,
      pagination.page,
      pagination.pageSize,
    );
  },

  async getLessonById(lessonId) {
    return mockLessons.find((lesson) => lesson.id === lessonId) ?? null;
  },

  async listActivities(filters) {
    return filterActivities(filters);
  },

  async searchActivitiesPage(filters, pagination) {
    const activities = filterActivities(filters);
    const start = (pagination.page - 1) * pagination.pageSize;
    return numberedPage(
      activities.slice(start, start + pagination.pageSize),
      activities.length,
      pagination.page,
      pagination.pageSize,
    );
  },

  async getActivityById(activityId) {
    return mockActivities.find((activity) => activity.id === activityId) ?? null;
  },

  async getTaxonomyTree() {
    return mockTaxonomyTree;
  },
};
