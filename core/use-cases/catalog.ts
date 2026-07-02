import type {
  ActivityQuestionDto,
  CefrLevel,
  LessonCategory,
  LessonDetailDto,
  LessonSummaryDto,
  TaxonomyNodeDto,
} from "@/core/models";
import type { LearningContentPort } from "@/core/ports";

export interface CatalogQuery {
  query?: string;
  level?: CefrLevel;
}

function matchesQuery(values: string[], query?: string): boolean {
  const normalizedQuery = query?.trim().toLocaleLowerCase();
  if (!normalizedQuery) return true;
  return values.some((value) =>
    value.toLocaleLowerCase().includes(normalizedQuery),
  );
}

export async function listLessonCatalog(
  content: LearningContentPort,
  query: CatalogQuery & { category?: LessonCategory },
): Promise<LessonSummaryDto[]> {
  const lessons = await content.listLessons({
    level: query.level,
    category: query.category,
  });
  return lessons.filter((lesson) =>
    matchesQuery([lesson.title, lesson.summary, ...lesson.tags], query.query),
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
  query: CatalogQuery & { taxonomyNodeId?: string },
): Promise<ActivityQuestionDto[]> {
  const activities = await content.listActivities({
    level: query.level,
    taxonomyNodeId: query.taxonomyNodeId,
  });
  return activities.filter((activity) =>
    matchesQuery(
      [activity.id, activity.type, activity.taxonomyNodeId],
      query.query,
    ),
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
