import type { ActivityCatalogPort } from "@/core/content/ports/catalog-ports";
import type { Activity } from "@/core/content/domain/types/activity";
import type { CefrLevelFilter } from "@/core/models/level";
import type { RandomSourcePort } from "@/core/shared/kernel";
import { InsufficientActivitiesForScopeException } from "@/core/shared/exceptions";

export interface DailyPracticePlanInput {
  lessonIds: string[];
  level: CefrLevelFilter;
  count: number;
}

export interface PlannedDailyActivities {
  activityIds: string[];
  activityVersionIds: Array<string | null>;
  activitySnapshots: Activity[];
}

/** Selecciona actividades únicamente de las lecciones fijadas en la sesión. */
export class DailyPracticePlanner {
  constructor(private readonly random: RandomSourcePort) {}

  async plan(
    catalog: ActivityCatalogPort,
    input: DailyPracticePlanInput,
  ): Promise<PlannedDailyActivities> {
    const activities = await catalog.listActivities({
      level: input.level,
      lessonIds: input.lessonIds,
    });
    if (activities.length < input.count) {
      throw new InsufficientActivitiesForScopeException(
        `Not enough daily activities (need ${input.count}, have ${activities.length})`,
        "There are not enough activities for today's practice.",
        { requested: input.count, available: activities.length },
      );
    }
    const selected = this.random
      .shuffle(activities)
      .slice(0, input.count);
    return {
      activityIds: selected.map((activity) => activity.id),
      activityVersionIds: selected.map((activity) => activity.versionId ?? null),
      activitySnapshots: selected,
    };
  }
}
