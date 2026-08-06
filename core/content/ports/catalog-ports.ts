import type { CefrLevel, CefrLevelFilter } from "@/core/models/level";
import type { Lesson } from "../domain/types/lesson";
import type { Activity } from "../domain/types/activity";
import type { TaxonomyNode } from "../domain/types/taxonomy";
import type { ContentVersion } from "../domain/content-version";
import type {
  CursorPage,
  CursorPaginationParams,
  NumberedPage,
  NumberedPaginationParams,
} from "@/core/shared/kernel";

export interface LessonListFilters {
  category?: string;
  level?: CefrLevel;
  query?: string;
}

export interface ActivityListFilters {
  taxonomyNodeId?: string;
  taxonomyNodeIds?: string[];
  level?: CefrLevelFilter;
  lessonIds?: string[];
  query?: string;
  activityType?: string;
  interactionMode?: string;
}

export interface LessonCatalogSearchPort {
  searchLessonsPage(
    filters: LessonListFilters | undefined,
    pagination: NumberedPaginationParams,
  ): Promise<NumberedPage<Lesson>>;
}

export interface ActivityCatalogSearchPort {
  searchActivitiesPage(
    filters: ActivityListFilters | undefined,
    pagination: NumberedPaginationParams,
  ): Promise<NumberedPage<Activity>>;
}

export interface LessonCatalogPagePort {
  listLessonsPage(
    filters: LessonListFilters | undefined,
    pagination: CursorPaginationParams,
  ): Promise<CursorPage<Lesson>>;
}

export interface ActivityCatalogPagePort {
  listActivitiesPage(
    filters: ActivityListFilters | undefined,
    pagination: CursorPaginationParams,
  ): Promise<CursorPage<Activity>>;
}

export interface CatalogMetadata {
  datasetVersion: string;
  schemaVersion: string;
  lessonCount: number;
  activityCount: number;
  taxonomyNodeCount: number;
}

/** Puerta de entrada al catálogo de lecciones. */
export interface LessonCatalogPort {
  listLessons(filters?: LessonListFilters): Promise<Lesson[]>;
  getLessonById(lessonId: string): Promise<Lesson | null>;
}

/** Puerta de entrada al catálogo de actividades. */
export interface ActivityCatalogPort {
  listActivities(filters?: ActivityListFilters): Promise<Activity[]>;
  getActivityById(activityId: string): Promise<Activity | null>;
  /** Recupera una versión publicada concreta para corregir un snapshot. */
  getActivityByVersionId?(activityVersionId: string): Promise<Activity | null>;
  /** Cuenta actividades publicadas por nodo de taxonomía (incluye descendientes). */
  countActivitiesByNode(nodeId: string, level: CefrLevelFilter): Promise<number>;
  countActivitiesByNodes(nodeIds: string[], level: CefrLevelFilter): Promise<number>;
}

/** Puerta de entrada a la taxonomía. */
export interface TaxonomyCatalogPort {
  getTaxonomyTree(): Promise<TaxonomyNode[]>;
  /** Resuelve un nodo y todos sus descendientes seleccionables. */
  resolveNodeWithDescendants(nodeId: string): Promise<TaxonomyNode[]>;
  /** Devuelve el path desde la raíz hasta el nodo indicado. */
  getNodePath(nodeId: string): Promise<TaxonomyNode[]>;
  getContentVersion(): Promise<ContentVersion>;
}

export interface CatalogMetadataPort {
  getCatalogMetadata(): Promise<CatalogMetadata>;
}
