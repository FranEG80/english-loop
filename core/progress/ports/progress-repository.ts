export interface ActivityProgressRecord {
  userId: string;
  activityId: string;
  attemptsCount: number;
  correctCount: number;
  lastResult: boolean | null;
  lastAttemptAt: string | null;
}

export interface TaxonomyProgressRecord {
  userId: string;
  taxonomyNodeId: string;
  attemptsCount: number;
  correctCount: number;
}

export interface ProgressRepository {
  getActivityProgress(
    userId: string,
    activityId: string,
  ): Promise<ActivityProgressRecord | null>;
  upsertActivityProgress(record: ActivityProgressRecord): Promise<void>;
  upsertTaxonomyProgress(record: TaxonomyProgressRecord): Promise<void>;
  getTaxonomyProgress(
    userId: string,
    taxonomyNodeId: string,
  ): Promise<TaxonomyProgressRecord | null>;
  /** Resumen agregado de progreso del usuario. */
  getOverview(userId: string): Promise<{
    totalActivitiesCompleted: number;
    totalCorrect: number;
    totalAttempts: number;
    strongTopicIds: string[];
    weakTopicIds: string[];
  }>;
}
