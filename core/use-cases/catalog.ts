import type {
  ActivityQuestionDto,
  ActivityType,
  CefrLevel,
  InteractionMode,
  LessonDetailDto,
  LessonSummaryDto,
  TaxonomyNodeDto,
} from "@/core/models";
import type { LearningContentPort } from "@/core/ports";
import type {
  NumberedPage,
  NumberedPaginationParams,
} from "@/core/shared/kernel";

export interface CatalogQuery {
  query?: string;
  level?: CefrLevel;
}

function matchesQuery(values: string[], query?: string): boolean {
  const normalize = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[-_]+/g, " ")
      .toLocaleLowerCase()
      .trim();
  const normalizedQuery = query ? normalize(query) : "";
  if (!normalizedQuery) return true;
  const queryTerms = normalizedQuery.split(/\s+/).filter(Boolean);
  return values.some((value) => {
    const normalizedValue = normalize(value);
    return (
      normalizedValue.includes(normalizedQuery) ||
      queryTerms.every((term) => normalizedValue.includes(term))
    );
  });
}

export async function listLessonCatalog(
  content: LearningContentPort,
  query: CatalogQuery & { category?: string },
): Promise<LessonSummaryDto[]> {
  const lessons = await content.listLessons({
    level: query.level,
    category: query.category,
  });
  return lessons.filter((lesson) =>
    matchesQuery(
      [
        lesson.id,
        lesson.title,
        lesson.summary,
        lesson.category,
        lesson.taxonomyNodeId,
        ...lesson.tags,
      ],
      query.query,
    ),
  );
}

export function searchLessonCatalogPage(
  content: LearningContentPort,
  query: CatalogQuery & { category?: string },
  pagination: NumberedPaginationParams,
): Promise<NumberedPage<LessonSummaryDto>> {
  if (!content.searchLessonsPage) {
    throw new Error("The learning content adapter does not support catalog search");
  }
  return content.searchLessonsPage(
    {
      query: query.query,
      level: query.level,
      category: query.category,
    },
    pagination,
  );
}

export async function getLessonDetail(
  content: LearningContentPort,
  lessonId: string,
): Promise<LessonDetailDto | null> {
  return content.getLessonById(lessonId);
}

export async function listActivityCatalog(
  content: LearningContentPort,
  query: CatalogQuery & {
    interactionMode?: InteractionMode;
    taxonomyNodeId?: string;
    type?: ActivityType;
  },
): Promise<ActivityQuestionDto[]> {
  const activities = await content.listActivities({
    level: query.level,
    taxonomyNodeId: query.taxonomyNodeId,
  });
  return activities.filter((activity) => {
    if (query.type && activity.type !== query.type) return false;
    if (
      query.interactionMode &&
      activity.interactionMode !== query.interactionMode
    ) {
      return false;
    }
    return matchesQuery(
      [activity.id, activity.type, activity.taxonomyNodeId],
      query.query,
    );
  });
}

export function searchActivityCatalogPage(
  content: LearningContentPort,
  query: CatalogQuery & {
    interactionMode?: InteractionMode;
    taxonomyNodeId?: string;
    type?: ActivityType;
  },
  pagination: NumberedPaginationParams,
): Promise<NumberedPage<ActivityQuestionDto>> {
  if (!content.searchActivitiesPage) {
    throw new Error("The learning content adapter does not support catalog search");
  }
  return content.searchActivitiesPage(
    {
      query: query.query,
      level: query.level,
      taxonomyNodeId: query.taxonomyNodeId,
      type: query.type,
      interactionMode: query.interactionMode,
    },
    pagination,
  );
}

export async function getActivityDetail(
  content: LearningContentPort,
  activityId: string,
): Promise<ActivityQuestionDto | null> {
  return content.getActivityById(activityId);
}

export async function getTaxonomy(
  content: LearningContentPort,
): Promise<TaxonomyNodeDto[]> {
  return content.getTaxonomyTree();
}
