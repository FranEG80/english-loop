import type { LessonDetailDto, LessonSummaryDto } from "../models/lesson";
import type { ActivityQuestionDto } from "../models/activity";
import type { TaxonomyNodeDto } from "../models/taxonomy";
import type { CefrLevel, CefrLevelFilter } from "../models/level";

export interface LessonListFilters {
  category?: string;
  level?: CefrLevel;
}

export interface ActivityListFilters {
  taxonomyNodeId?: string;
  level?: CefrLevelFilter;
  lessonIds?: string[];
}

export interface LearningContentPort {
  listLessons(filters?: LessonListFilters): Promise<LessonSummaryDto[]>;
  getLessonById(lessonId: string): Promise<LessonDetailDto | null>;
  listActivities(filters?: ActivityListFilters): Promise<ActivityQuestionDto[]>;
  getActivityById(activityId: string): Promise<ActivityQuestionDto | null>;
  getTaxonomyTree(): Promise<TaxonomyNodeDto[]>;
}
