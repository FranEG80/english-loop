import type { D1Operation, D1OperationName } from "../types/operations";

export const d1OperationNames: readonly D1OperationName[] = [
  "health", "activeCatalogMetadata", "activityById", "catalogLessons", "catalogActivities",
  "catalogTaxonomy", "catalogCounts", "userSettingsGet", "userSettingsSave", "savedLessonsList",
  "savedLessonGet", "savedLessonSave", "savedLessonDelete", "dailySessionGetById",
  "dailySessionGetByUserDate", "dailySessionGetByPracticeRun", "dailySessionSave", "practiceRunGet",
  "practiceRunSave", "attemptGetByIdempotency", "attemptsGetByRun", "attemptsGetByUserActivity",
  "attemptSave", "lessonProgressList", "lessonProgressSave", "activityProgressGet",
  "activityProgressSave", "taxonomyProgressGet", "taxonomyProgressSave", "progressOverview",
  "reviewGetByActivity", "reviewGetDue", "reviewGetUpcoming", "reviewSave", "rateLimitConsume",
  "authCreate", "authFindOne", "authFindMany", "authCount", "authUpdate", "authUpdateMany",
  "authDelete", "authDeleteMany", "authConsumeOne", "authIncrementOne", "consumeVerification",
  "acceptReplayNonce",
];

type RecordValue = Record<string, unknown>;

function isRecord(value: unknown): value is RecordValue {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasStrings(value: RecordValue, fields: string[]): boolean {
  return fields.every((field) => typeof value[field] === "string" && value[field] !== "");
}

function hasSnapshot(value: RecordValue, fields: string[]): value is RecordValue & { snapshot: RecordValue } {
  return isRecord(value.snapshot) && hasStrings(value.snapshot, fields);
}

function isAuthQuery(value: unknown): boolean {
  if (!isRecord(value) || !["user", "session", "account", "verification"].includes(String(value.model))) return false;
  if (value.where !== undefined && (!Array.isArray(value.where) || !value.where.every(isRecord))) return false;
  if (value.limit !== undefined && (typeof value.limit !== "number" || value.limit <= 0)) return false;
  if (value.offset !== undefined && (typeof value.offset !== "number" || value.offset < 0)) return false;
  if (value.select !== undefined && (!Array.isArray(value.select) || !value.select.every((field) => typeof field === "string"))) return false;
  return true;
}

/** Validates the transport envelope before it can reach the SQL allow-list. */
export function isD1Operation(value: unknown): value is D1Operation {
  if (!isRecord(value) || typeof value.name !== "string") return false;
  switch (value.name) {
    case "health":
    case "activeCatalogMetadata":
    case "catalogTaxonomy":
      return true;
    case "activityById":
      return hasStrings(value, ["activityId"]);
    case "userSettingsGet":
    case "savedLessonsList":
    case "lessonProgressList":
    case "progressOverview":
      return hasStrings(value, ["userId"]);
    case "catalogLessons":
      return (value.level === undefined || typeof value.level === "string") &&
        (value.category === undefined || typeof value.category === "string");
    case "catalogActivities":
      return (value.taxonomyNodeId === undefined || typeof value.taxonomyNodeId === "string") &&
        (value.level === undefined || typeof value.level === "string") &&
        (value.lessonIds === undefined || (Array.isArray(value.lessonIds) && value.lessonIds.every((id) => typeof id === "string")));
    case "catalogCounts":
      return value.kind === "lessons" || value.kind === "activities" || value.kind === "taxonomy";
    case "userSettingsSave":
      return hasSnapshot(value, ["userId", "locale", "activeLevels", "timezone"]) &&
        typeof value.snapshot.dailyGoalLessons === "number" && typeof value.snapshot.dailyGoalActivities === "number" &&
        typeof value.snapshot.reducedMotion === "boolean";
    case "savedLessonGet":
    case "savedLessonDelete":
      return hasStrings(value, ["userId", "lessonId"]);
    case "savedLessonSave":
      return hasSnapshot(value, ["userId", "lessonId", "savedAt"]);
    case "dailySessionGetById":
      return hasStrings(value, ["sessionId"]);
    case "dailySessionGetByUserDate":
      return hasStrings(value, ["userId", "date"]);
    case "dailySessionGetByPracticeRun":
      return hasStrings(value, ["practiceRunId"]);
    case "dailySessionSave":
      return hasSnapshot(value, ["id", "userId", "date", "status", "datasetVersion", "seed", "createdAt"]) && Array.isArray(value.snapshot.lessons);
    case "practiceRunGet":
      return hasStrings(value, ["runId"]);
    case "practiceRunSave":
      return hasSnapshot(value, ["id", "userId", "mode", "status", "scopeSnapshot", "datasetVersion", "createdAt"]) &&
        typeof value.snapshot.currentIndex === "number" && typeof value.snapshot.originalActivityCount === "number" && Array.isArray(value.snapshot.items);
    case "attemptGetByIdempotency":
      return hasStrings(value, ["userId", "idempotencyKey"]);
    case "attemptsGetByRun":
      return hasStrings(value, ["practiceRunId"]);
    case "attemptsGetByUserActivity":
      return hasStrings(value, ["userId", "activityId"]) && typeof value.limit === "number" && value.limit > 0;
    case "attemptSave":
      return hasSnapshot(value, ["id", "userId", "activityId", "origin", "idempotencyKey", "response", "evaluatorVersion", "submittedAt"]) &&
        typeof value.snapshot.isCorrect === "boolean" && typeof value.snapshot.isRepetition === "boolean";
    case "lessonProgressSave":
      return hasSnapshot(value, ["userId", "lessonId"]) && typeof value.snapshot.viewed === "boolean" && typeof value.snapshot.errorsPending === "number";
    case "activityProgressGet":
      return hasStrings(value, ["userId", "activityId"]);
    case "activityProgressSave":
      return hasSnapshot(value, ["userId", "activityId"]) && typeof value.snapshot.attemptsCount === "number" && typeof value.snapshot.correctCount === "number";
    case "taxonomyProgressGet":
      return hasStrings(value, ["userId", "taxonomyNodeId"]);
    case "taxonomyProgressSave":
      return hasSnapshot(value, ["userId", "taxonomyNodeId"]) && typeof value.snapshot.attemptsCount === "number" && typeof value.snapshot.correctCount === "number";
    case "reviewGetByActivity":
      return hasStrings(value, ["userId", "activityId"]);
    case "reviewGetDue":
      return hasStrings(value, ["userId", "nowIso"]);
    case "reviewGetUpcoming":
      return hasStrings(value, ["userId", "nowIso"]) && typeof value.limit === "number" && value.limit > 0;
    case "reviewSave":
      return hasSnapshot(value, ["id", "userId", "activityId", "taxonomyNodeId", "level", "dueAt", "failedAt"]) &&
        typeof value.snapshot.stage === "number" && typeof value.snapshot.consecutiveCorrect === "number" && typeof value.snapshot.attemptsCount === "number";
    case "rateLimitConsume":
      return hasSnapshot(value, ["key", "nowIso", "resetAtIso"]) && typeof value.snapshot.max === "number";
    case "consumeVerification":
      return hasStrings(value, ["identifier", "value", "nowIso"]);
    case "acceptReplayNonce":
      return hasStrings(value, ["nonce", "nowIso", "expiresAtIso"]);
    case "authCreate":
      return ["user", "session", "account", "verification"].includes(String(value.model)) && isRecord(value.data);
    case "authFindOne":
    case "authFindMany":
    case "authCount":
    case "authDelete":
    case "authDeleteMany":
    case "authConsumeOne":
      return isAuthQuery(value.query);
    case "authUpdate":
    case "authUpdateMany":
      return isAuthQuery(value.query) && isRecord(value.update);
    case "authIncrementOne":
      return isAuthQuery(value.query) && isRecord(value.increment) && Object.values(value.increment).every((item) => typeof item === "number") &&
        (value.set === undefined || isRecord(value.set));
    default:
      return false;
  }
}

export function isD1OperationName(value: string): value is D1OperationName {
  return d1OperationNames.includes(value as D1OperationName);
}
