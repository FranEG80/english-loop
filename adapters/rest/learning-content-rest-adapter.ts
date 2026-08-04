import type { LearningContentPort } from "@/core/ports";
import type { ActivityQuestionDto, LessonDetailDto, LessonSummaryDto, TaxonomyNodeDto } from "@/core/models";
import type { CursorPage } from "@/core/shared/kernel";
import { restRequest } from "./http-client";

function toQueryString<T extends object>(params?: T): string {
  if (!params) return "";
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const item of value) search.append(key, String(item));
    } else {
      search.set(key, String(value));
    }
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

export const learningContentRestAdapter: LearningContentPort = {
  listLessons: async (filters) =>
    (await restRequest<CursorPage<LessonSummaryDto>>(`/lessons${toQueryString(filters)}`)).items,
  getLessonById: (lessonId) =>
    restRequest<LessonDetailDto | null>(`/lessons/${lessonId}`),
  listActivities: async (filters) =>
    (await restRequest<CursorPage<ActivityQuestionDto>>(`/activities${toQueryString(filters)}`)).items,
  getActivityById: (activityId) =>
    restRequest<ActivityQuestionDto | null>(`/activities/${activityId}`),
  getTaxonomyTree: () => restRequest<TaxonomyNodeDto[]>("/practice-taxonomy"),
};
