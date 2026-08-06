import type { LearningContentPort } from "@/core/ports";
import type { ActivityQuestionDto, LessonDetailDto, LessonSummaryDto, TaxonomyNodeDto } from "@/core/models";
import type { CursorPage, NumberedPage } from "@/core/shared/kernel";
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

function toApiFilters<T extends { query?: string; interactionMode?: string }>(
  filters?: T,
) {
  if (!filters) return undefined;
  const { query, interactionMode, ...rest } = filters;
  return {
    ...rest,
    q: query,
    interaction: interactionMode,
  };
}

export const learningContentRestAdapter: LearningContentPort = {
  listLessons: async (filters) =>
    (await restRequest<CursorPage<LessonSummaryDto>>(`/lessons${toQueryString(toApiFilters(filters))}`)).items,
  searchLessonsPage: (filters, pagination) =>
    restRequest<NumberedPage<LessonSummaryDto>>(
      `/lessons${toQueryString({ ...toApiFilters(filters), ...pagination })}`,
    ),
  getLessonById: (lessonId) =>
    restRequest<LessonDetailDto | null>(`/lessons/${lessonId}`),
  listActivities: async (filters) =>
    (await restRequest<CursorPage<ActivityQuestionDto>>(`/activities${toQueryString(toApiFilters(filters))}`)).items,
  searchActivitiesPage: (filters, pagination) =>
    restRequest<NumberedPage<ActivityQuestionDto>>(
      `/activities${toQueryString({ ...toApiFilters(filters), ...pagination })}`,
    ),
  getActivityById: (activityId) =>
    restRequest<ActivityQuestionDto | null>(`/activities/${activityId}`),
  getTaxonomyTree: () => restRequest<TaxonomyNodeDto[]>("/practice-taxonomy"),
};
