import type { LessonDetailDto, LessonSummaryDto } from "../models/types/lesson";
import type { ActivityQuestionDto } from "../models/types/activity";
import type { TaxonomyNodeDto } from "../models/types/taxonomy";
import type { CefrLevel, CefrLevelFilter } from "../models/level";
import type { ActivityType, InteractionMode } from "../models/types/activity";
import type {
  NumberedPage,
  NumberedPaginationParams,
} from "../shared/kernel";

export interface LessonListFilters {
  category?: string;
  level?: CefrLevel;
  query?: string;
}

export interface ActivityListFilters {
  taxonomyNodeId?: string;
  level?: CefrLevelFilter;
  lessonIds?: string[];
  query?: string;
  type?: ActivityType;
  interactionMode?: InteractionMode;
}

export interface LearningContentPort {
  listLessons(filters?: LessonListFilters): Promise<LessonSummaryDto[]>;
  searchLessonsPage(
    filters: LessonListFilters | undefined,
    pagination: NumberedPaginationParams,
  ): Promise<NumberedPage<LessonSummaryDto>>;
  getLessonById(lessonId: string): Promise<LessonDetailDto | null>;
  listActivities(filters?: ActivityListFilters): Promise<ActivityQuestionDto[]>;
  searchActivitiesPage(
    filters: ActivityListFilters | undefined,
    pagination: NumberedPaginationParams,
  ): Promise<NumberedPage<ActivityQuestionDto>>;
  getActivityById(activityId: string): Promise<ActivityQuestionDto | null>;
  getTaxonomyTree(): Promise<TaxonomyNodeDto[]>;
}
