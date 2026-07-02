import type { LessonDetailDto, LessonSummaryDto } from "../models/lesson";
import type { ActivityQuestionDto } from "../models/activity";
import type { FlashcardStackDto } from "../models/flashcard";
import type { CanvasPreviewDto } from "../models/canvas-preview";
import type { TaxonomyNodeDto } from "../models/taxonomy";
import type { CefrLevel } from "../models/level";

export interface LessonListFilters {
  category?: string;
  level?: CefrLevel;
}

export interface ActivityListFilters {
  taxonomyNodeId?: string;
  level?: CefrLevel;
}

export interface LearningContentPort {
  listLessons(filters?: LessonListFilters): Promise<LessonSummaryDto[]>;
  getLessonById(lessonId: string): Promise<LessonDetailDto | null>;
  listActivities(filters?: ActivityListFilters): Promise<ActivityQuestionDto[]>;
  getActivityById(activityId: string): Promise<ActivityQuestionDto | null>;
  getFlashcardStack(stackId: string): Promise<FlashcardStackDto | null>;
  getCanvasPreview(previewId: string): Promise<CanvasPreviewDto | null>;
  getTaxonomyTree(): Promise<TaxonomyNodeDto[]>;
}
