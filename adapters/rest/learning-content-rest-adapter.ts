import type { LearningContentPort } from "@/core/ports";
import type {
  ActivityQuestionDto,
  CanvasPreviewDto,
  FlashcardStackDto,
  LessonDetailDto,
  LessonSummaryDto,
  TaxonomyNodeDto,
} from "@/core/models";
import { restRequest } from "./http-client";

function toQueryString<T extends object>(params?: T): string {
  if (!params) return "";
  const entries = Object.entries(params)
    .filter((entry): entry is [string, string | number] => entry[1] !== undefined)
    .map(([key, value]): [string, string] => [key, String(value)]);
  if (entries.length === 0) return "";
  return `?${new URLSearchParams(entries).toString()}`;
}

export const learningContentRestAdapter: LearningContentPort = {
  listLessons: (filters) =>
    restRequest<LessonSummaryDto[]>(`/lessons${toQueryString(filters)}`),
  getLessonById: (lessonId) =>
    restRequest<LessonDetailDto | null>(`/lessons/${lessonId}`),
  listActivities: (filters) =>
    restRequest<ActivityQuestionDto[]>(`/activities${toQueryString(filters)}`),
  getActivityById: (activityId) =>
    restRequest<ActivityQuestionDto | null>(`/activities/${activityId}`),
  getFlashcardStack: (stackId) =>
    restRequest<FlashcardStackDto | null>(`/flashcard-stacks/${stackId}`),
  getCanvasPreview: (previewId) =>
    restRequest<CanvasPreviewDto | null>(`/canvas-previews/${previewId}`),
  getTaxonomyTree: () => restRequest<TaxonomyNodeDto[]>("/taxonomy"),
};
