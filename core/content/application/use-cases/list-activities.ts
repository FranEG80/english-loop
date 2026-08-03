import type { Activity } from "../../domain/types/activity";
import type { ActivityCatalogPort } from "../../ports/catalog-ports";
import type { CefrLevelFilter } from "@/core/models/level";

export interface ListActivitiesInput {
  taxonomyNodeId?: string;
  level?: CefrLevelFilter;
  lessonIds?: string[];
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

/** Obtiene una actividad por ID (lado servidor, incluye evaluador). */
export async function getActivity(
  catalog: ActivityCatalogPort,
  activityId: string,
): Promise<Activity | null> {
  return catalog.getActivityById(activityId);
}
