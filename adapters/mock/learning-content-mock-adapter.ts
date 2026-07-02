import type { LearningContentPort } from "@/core/ports";
import { mockLessons } from "./data/lessons";
import { mockActivities } from "./data/activities";
import { mockFlashcardStack } from "./data/flashcards";
import { mockCanvasPreview } from "./data/canvas-preview";
import {
  collectDescendantIds,
  findTaxonomyNode,
  mockTaxonomyTree,
} from "./data/taxonomy";

export const learningContentMockAdapter: LearningContentPort = {
  async listLessons(filters) {
    return mockLessons.filter((lesson) => {
      if (filters?.category && lesson.category !== filters.category) {
        return false;
      }
      if (filters?.level && lesson.level !== filters.level) return false;
      return true;
    });
  },

  async getLessonById(lessonId) {
    return mockLessons.find((lesson) => lesson.id === lessonId) ?? null;
  },

  async listActivities(filters) {
    return mockActivities.filter((activity) => {
      if (filters?.level && activity.level !== filters.level) return false;
      if (filters?.taxonomyNodeId) {
        const node = findTaxonomyNode(filters.taxonomyNodeId);
        const scopedIds = node
          ? new Set(collectDescendantIds(node))
          : new Set([filters.taxonomyNodeId]);
        if (!scopedIds.has(activity.taxonomyNodeId)) return false;
      }
      return true;
    });
  },

  async getActivityById(activityId) {
    return mockActivities.find((activity) => activity.id === activityId) ?? null;
  },

  async getFlashcardStack(stackId) {
    return mockFlashcardStack.id === stackId ? mockFlashcardStack : null;
  },

  async getCanvasPreview(previewId) {
    return mockCanvasPreview.id === previewId ? mockCanvasPreview : null;
  },

  async getTaxonomyTree() {
    return mockTaxonomyTree;
  },
};
