import type { CefrLevelFilter } from "@/core/models/level";
import type { ActivityCatalogPort, TaxonomyCatalogPort } from "../../ports/catalog-ports";

export interface ScopeAvailability {
  nodeId: string;
  level: CefrLevelFilter;
  availableActivityCount: number;
  minRequiredActivities: number;
  isEligible: boolean;
}

/** Comprueba si un nodo (y sus descendientes) tiene contenido suficiente. */
export async function getScopeAvailability(
  activities: ActivityCatalogPort,
  taxonomy: TaxonomyCatalogPort,
  nodeId: string,
  level: CefrLevelFilter,
  minRequiredActivities = 5,
): Promise<ScopeAvailability> {
  const descendants = await taxonomy.resolveNodeWithDescendants(nodeId);
  const availableActivityCount = await activities.countActivitiesByNodes(
    descendants.map((node) => node.id),
    level,
  );
  return {
    nodeId,
    level,
    availableActivityCount,
    minRequiredActivities,
    isEligible: availableActivityCount >= minRequiredActivities,
  };
}
