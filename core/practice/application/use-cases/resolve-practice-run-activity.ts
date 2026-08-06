import type { Activity } from "@/core/content/domain/types/activity";
import type { ActivityCatalogPort } from "@/core/content/ports/catalog-ports";
import type { PracticeRun } from "../../domain/practice-run";

/**
 * Resolves the activity using the immutable run snapshot first. A run may
 * outlive the catalog release or even switch catalog implementations, so a
 * current catalog lookup is only a compatibility fallback for old runs.
 */
export async function resolvePracticeRunActivity(
  activityCatalog: ActivityCatalogPort,
  run: PracticeRun,
  activityId: string,
): Promise<Activity | null> {
  const snapshot = run.currentActivitySnapshot;
  if (snapshot?.id === activityId) return snapshot;

  if (run.currentActivityVersionId && activityCatalog.getActivityByVersionId) {
    const pinned = await activityCatalog.getActivityByVersionId(
      run.currentActivityVersionId,
    );
    if (pinned) return pinned;
  }

  return activityCatalog.getActivityById(activityId);
}
