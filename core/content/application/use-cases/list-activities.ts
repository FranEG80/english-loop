import type { Activity } from "../../domain/types/activity";
import type { ActivityCatalogPort } from "../../ports/catalog-ports";
import type { CefrLevelFilter } from "@/core/models/level";
import type { CursorPage, CursorPaginationParams } from "@/core/shared/kernel";
import type { ActivityCatalogPagePort } from "../../ports/catalog-ports";
import type { ActivityCatalogSearchPort } from "../../ports/catalog-ports";
import type {
  NumberedPage,
  NumberedPaginationParams,
} from "@/core/shared/kernel";

export interface ListActivitiesInput {
  taxonomyNodeId?: string;
  taxonomyNodeIds?: string[];
  level?: CefrLevelFilter;
  lessonIds?: string[];
  query?: string;
  activityType?: string;
  interactionMode?: string;
}

/** Lista actividades publicadas, opcionalmente filtradas. */
export async function listActivities(
  catalog: ActivityCatalogPort,
  input: ListActivitiesInput = {},
): Promise<Activity[]> {
  return catalog.listActivities({
    taxonomyNodeId: input.taxonomyNodeId,
    level: input.level,
    lessonIds: input.lessonIds,
  });
}

export async function listActivitiesPage(
  catalog: ActivityCatalogPagePort,
  input: ListActivitiesInput & { pagination: CursorPaginationParams },
): Promise<CursorPage<Activity>> {
  return catalog.listActivitiesPage(
    {
      taxonomyNodeId: input.taxonomyNodeId,
      level: input.level,
      lessonIds: input.lessonIds,
    },
    input.pagination,
  );
}

export async function searchActivitiesPage(
  catalog: ActivityCatalogSearchPort,
  input: ListActivitiesInput & { pagination: NumberedPaginationParams },
): Promise<NumberedPage<Activity>> {
  return catalog.searchActivitiesPage(
    {
      taxonomyNodeId: input.taxonomyNodeId,
      taxonomyNodeIds: input.taxonomyNodeIds,
      level: input.level,
      lessonIds: input.lessonIds,
      query: input.query,
      activityType: input.activityType,
      interactionMode: input.interactionMode,
    },
    input.pagination,
  );
}

/** Obtiene una actividad por ID (lado servidor, incluye evaluador). */
export async function getActivity(
  catalog: ActivityCatalogPort,
  activityId: string,
): Promise<Activity | null> {
  return catalog.getActivityById(activityId);
}
