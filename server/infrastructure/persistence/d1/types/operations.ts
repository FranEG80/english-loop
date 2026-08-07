export type D1OperationName =
  | "health"
  | "activeCatalogMetadata"
  | "activityById"
  | "activityByVersionId"
  | "catalogLessons"
  | "catalogActivities"
  | "catalogTaxonomy"
  | "catalogCounts"
  | "userSettingsGet"
  | "userSettingsSave"
  | "savedLessonsList"
  | "savedLessonGet"
  | "savedLessonSave"
  | "savedLessonDelete"
  | "dailySessionGetById"
  | "dailySessionGetByUserDate"
  | "dailySessionGetByPracticeRun"
  | "dailySessionSave"
  | "practiceRunGet"
  | "practiceRunSave"
  | "attemptGetByIdempotency"
  | "attemptsGetByRun"
  | "attemptsGetByUserActivity"
  | "attemptSave"
  | "lessonProgressList"
  | "lessonProgressSave"
  | "activityProgressGet"
  | "activityProgressSave"
  | "taxonomyProgressGet"
  | "taxonomyProgressSave"
  | "progressOverview"
  | "reviewGetByActivity"
  | "reviewGetDue"
  | "reviewGetUpcoming"
  | "reviewSave"
  | "rateLimitConsume"
  | "authCreate"
  | "authFindOne"
  | "authFindMany"
  | "authCount"
  | "authUpdate"
  | "authUpdateMany"
  | "authDelete"
  | "authDeleteMany"
  | "authConsumeOne"
  | "authIncrementOne"
  | "consumeVerification"
  | "acceptReplayNonce";

export interface D1UserSettingsSnapshot {
  userId: string;
  locale: string;
  activeLevels: string;
  dailyGoalLessons: number;
  dailyGoalActivities: number;
  timezone: string;
  reducedMotion: boolean;
}

export interface D1SavedLessonSnapshot {
  userId: string;
  lessonId: string;
  savedAt: string;
}

export interface D1LessonProgressSnapshot {
  userId: string;
  lessonId: string;
  viewed: boolean;
  viewedAt: string | null;
  errorsPending: number;
}

export interface D1ActivityProgressSnapshot {
  userId: string;
  activityId: string;
  attemptsCount: number;
  correctCount: number;
  lastResult: boolean | null;
  lastAttemptAt: string | null;
}

export interface D1TaxonomyProgressSnapshot {
  userId: string;
  taxonomyNodeId: string;
  attemptsCount: number;
  correctCount: number;
}

export interface D1AttemptSnapshot {
  id: string;
  userId: string;
  practiceRunId: string | null;
  activityId: string;
  activityVersionId: string | null;
  practiceRunItemId: string | null;
  origin: string;
  idempotencyKey: string;
  response: string;
  isCorrect: boolean;
  isRepetition: boolean;
  evaluatorVersion: string;
  submittedAt: string;
}

export interface D1ReviewSnapshot {
  id: string;
  userId: string;
  activityId: string;
  activityVersionId: string | null;
  lessonId: string | null;
  taxonomyNodeId: string;
  level: string;
  stage: number;
  consecutiveCorrect: number;
  dueAt: string;
  failedAt: string;
  resolvedAt: string | null;
  attemptsCount: number;
}

export interface D1DailySessionLessonSnapshot {
  lessonId: string;
  order: number;
  status: string;
  selectionReason: string;
  completedAt: string | null;
}

export interface D1DailySessionSnapshot {
  id: string;
  userId: string;
  date: string;
  status: string;
  datasetVersion: string;
  seed: string;
  practiceRunId: string | null;
  createdAt: string;
  lessons: D1DailySessionLessonSnapshot[];
}

export interface D1PracticeRunItemSnapshot {
  position: number;
  lessonId: string | null;
  activityId: string;
  activityVersionId: string | null;
  activitySnapshot: string | null;
  origin: string;
  status: string;
  isRepetition: boolean;
  repetitionOfItemId: string | null;
}

export interface D1PracticeRunSnapshot {
  id: string;
  userId: string;
  mode: string;
  status: string;
  scopeSnapshot: string;
  currentIndex: number;
  originalActivityCount: number;
  datasetVersion: string;
  createdAt: string;
  items: D1PracticeRunItemSnapshot[];
}

export interface D1RateLimitSnapshot {
  key: string;
  nowIso: string;
  resetAtIso: string;
  max: number;
}

export type D1AuthModel = "user" | "session" | "account" | "verification";
export type D1AuthValue = string | number | boolean | null | string[] | number[];
export interface D1AuthWhere {
  field: string;
  operator?: "eq" | "ne" | "lt" | "lte" | "gt" | "gte" | "in" | "not_in" | "contains" | "starts_with" | "ends_with";
  value: D1AuthValue;
  connector?: "AND" | "OR";
}
export interface D1AuthQuery {
  model: D1AuthModel;
  where?: D1AuthWhere[];
  limit?: number;
  offset?: number;
  sortBy?: { field: string; direction: "asc" | "desc" };
  select?: string[];
}

export type D1Operation =
  | { name: "health" }
  | { name: "activeCatalogMetadata" }
  | { name: "activityById"; activityId: string; includeDemo?: boolean }
  | { name: "activityByVersionId"; activityVersionId: string; includeDemo?: boolean }
  | { name: "catalogLessons"; level?: string; category?: string; queryTerms?: string[]; cursor?: string; offset?: number; limit?: number; includeDemo?: boolean }
  | { name: "catalogActivities"; taxonomyNodeId?: string; taxonomyNodeIds?: string[]; level?: string; lessonIds?: string[]; queryTerms?: string[]; activityType?: string; presentation?: string; cursor?: string; offset?: number; limit?: number; includeDemo?: boolean }
  | { name: "catalogTaxonomy" }
  | { name: "catalogCounts"; kind: "lessons" | "activities" | "taxonomy"; level?: string; category?: string; taxonomyNodeId?: string; taxonomyNodeIds?: string[]; lessonIds?: string[]; queryTerms?: string[]; activityType?: string; presentation?: string; includeDemo?: boolean }
  | { name: "userSettingsGet"; userId: string }
  | { name: "userSettingsSave"; snapshot: D1UserSettingsSnapshot }
  | { name: "savedLessonsList"; userId: string }
  | { name: "savedLessonGet"; userId: string; lessonId: string }
  | { name: "savedLessonSave"; snapshot: D1SavedLessonSnapshot }
  | { name: "savedLessonDelete"; userId: string; lessonId: string }
  | { name: "dailySessionGetById"; sessionId: string }
  | { name: "dailySessionGetByUserDate"; userId: string; date: string }
  | { name: "dailySessionGetByPracticeRun"; practiceRunId: string }
  | { name: "dailySessionSave"; snapshot: D1DailySessionSnapshot }
  | { name: "practiceRunGet"; runId: string }
  | { name: "practiceRunSave"; snapshot: D1PracticeRunSnapshot }
  | { name: "attemptGetByIdempotency"; userId: string; idempotencyKey: string }
  | { name: "attemptsGetByRun"; practiceRunId: string }
  | { name: "attemptsGetByUserActivity"; userId: string; activityId: string; limit: number }
  | { name: "attemptSave"; snapshot: D1AttemptSnapshot }
  | { name: "lessonProgressList"; userId: string }
  | { name: "lessonProgressSave"; snapshot: D1LessonProgressSnapshot }
  | { name: "activityProgressGet"; userId: string; activityId: string }
  | { name: "activityProgressSave"; snapshot: D1ActivityProgressSnapshot }
  | { name: "taxonomyProgressGet"; userId: string; taxonomyNodeId: string }
  | { name: "taxonomyProgressSave"; snapshot: D1TaxonomyProgressSnapshot }
  | { name: "progressOverview"; userId: string }
  | { name: "reviewGetByActivity"; userId: string; activityId: string }
  | { name: "reviewGetDue"; userId: string; nowIso: string }
  | { name: "reviewGetUpcoming"; userId: string; nowIso: string; limit: number }
  | { name: "reviewSave"; snapshot: D1ReviewSnapshot }
  | { name: "rateLimitConsume"; snapshot: D1RateLimitSnapshot }
  | { name: "authCreate"; model: D1AuthModel; data: Record<string, D1AuthValue>; select?: string[] }
  | { name: "authFindOne"; query: D1AuthQuery }
  | { name: "authFindMany"; query: D1AuthQuery }
  | { name: "authCount"; query: D1AuthQuery }
  | { name: "authUpdate"; query: D1AuthQuery; update: Record<string, D1AuthValue> }
  | { name: "authUpdateMany"; query: D1AuthQuery; update: Record<string, D1AuthValue> }
  | { name: "authDelete"; query: D1AuthQuery }
  | { name: "authDeleteMany"; query: D1AuthQuery }
  | { name: "authConsumeOne"; query: D1AuthQuery }
  | { name: "authIncrementOne"; query: D1AuthQuery; increment: Record<string, number>; set?: Record<string, D1AuthValue> }
  | { name: "consumeVerification"; identifier: string; value: string; nowIso: string }
  | { name: "acceptReplayNonce"; nonce: string; nowIso: string; expiresAtIso: string };
