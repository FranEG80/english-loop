import type { Activity } from "@/core/content/domain/types/activity";
import type { ActivityCatalogPort } from "@/core/content/ports/catalog-ports";
import type { RandomSourcePort } from "@/core/shared/kernel";
import type { CefrLevelFilter } from "@/core/models/level";
import { InsufficientActivitiesForScopeException } from "@/core/shared/exceptions";
import type { SessionSize } from "@/core/models/session-size";

const MAX_BALANCING_ROUNDS_PER_SUBTOPIC = 10;

export interface PlanPracticeRunInput {
  level: CefrLevelFilter;
  /** Nodo de taxonomía seleccionado. */
  taxonomyNodeId: string;
  /** IDs descendientes resueltos (incluye el propio nodo). */
  descendantIds: string[];
  requestedCount: SessionSize;
  /** IDs de actividades a excluir (ya vistas recientemente). */
  excludeActivityIds?: string[];
}

export interface PlannedActivities {
  activityIds: string[];
  activityVersionIds: Array<string | null>;
  activitySnapshots: Activity[];
  /** IDs de subtemas cubiertos. */
  coveredSubtopicIds: string[];
}

/**
 * Planifica un lote de actividades para un alcance. Para selecciones
 * generales, equilibra entre los descendientes; para selecciones específicas,
 * no mezcla nodos hermanos.
 */
export class PracticeRunPlanner {
  constructor(private readonly random: RandomSourcePort) {}

  async plan(
    catalog: ActivityCatalogPort,
    input: PlanPracticeRunInput,
  ): Promise<PlannedActivities> {
    const activities = await catalog.listActivities({
      level: input.level,
    });

    // Filtrar por nodos descendientes del alcance.
    const descendantSet = new Set(input.descendantIds);
    const inScope = activities.filter((activity) =>
      activity.taxonomyNodeIds.some((nodeId) => descendantSet.has(nodeId)),
    );

    // Excluir actividades recientes si hay suficiente pool.
    const excludeSet = new Set(input.excludeActivityIds ?? []);
    let pool = inScope.filter((activity) => !excludeSet.has(activity.id));
    if (pool.length < input.requestedCount) {
      pool = inScope;
    }

    if (pool.length < input.requestedCount) {
      throw new InsufficientActivitiesForScopeException(
        `Not enough activities for scope ${input.taxonomyNodeId} (need ${input.requestedCount}, have ${pool.length})`,
        "There are not enough activities for this selection yet.",
        { nodeId: input.taxonomyNodeId, requested: input.requestedCount, available: pool.length },
      );
    }

    // Equilibrar por subtema cuando la selección es general (varios descendientes).
    const selected = this.balanceBySubtopic(pool, input.requestedCount);

    return {
      activityIds: selected.map((activity) => activity.id),
      activityVersionIds: selected.map((activity) => activity.versionId ?? null),
      activitySnapshots: selected,
      coveredSubtopicIds: this.coveredSubtopics(selected),
    };
  }

  private balanceBySubtopic(
    pool: Activity[],
    count: number,
  ): Activity[] {
    const bySubtopic = new Map<string, Activity[]>();
    for (const activity of pool) {
      const key = activity.subtopic;
      const list = bySubtopic.get(key) ?? [];
      list.push(activity);
      bySubtopic.set(key, list);
    }

    const selected: Activity[] = [];
    const keys = [...bySubtopic.keys()];
    let round = 0;
    while (selected.length < count) {
      const key = keys[round % keys.length];
      const list = bySubtopic.get(key) ?? [];
      const available = list.filter((activity) => !selected.includes(activity));
      if (available.length > 0) {
        selected.push(available[this.random.int(available.length)]);
      }
      round += 1;
      if (round > keys.length * MAX_BALANCING_ROUNDS_PER_SUBTOPIC) break;
    }
    return selected.slice(0, count);
  }

  private coveredSubtopics(activities: Activity[]): string[] {
    return [...new Set(activities.map((activity) => activity.subtopic))];
  }
}
