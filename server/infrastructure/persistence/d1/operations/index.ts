import type { D1DatabaseLike } from "../types/binding";
import type { D1Operation } from "../types/operations";
import { prepareAccountOperation } from "./account-sql";
import { prepareAuthOperation } from "./auth-sql";
import { prepareCatalogOperation } from "./catalog-sql";
import { prepareLearningOperation } from "./learning-sql";
import { preparePracticeOperation } from "./practice-sql";
import { prepareProgressOperation } from "./progress-sql";
import { prepareSystemOperation } from "./system-sql";
import type { PreparedOperation } from "./shared";

export function prepareD1Operation(database: D1DatabaseLike, operation: D1Operation): PreparedOperation {
  switch (operation.name) {
    case "health":
    case "activeCatalogMetadata":
    case "rateLimitConsume":
    case "consumeVerification":
    case "acceptReplayNonce":
      return prepareSystemOperation(database, operation);
    case "activityById":
    case "catalogLessons":
    case "catalogActivities":
    case "catalogTaxonomy":
    case "catalogCounts":
      return prepareCatalogOperation(database, operation);
    case "userSettingsGet":
    case "userSettingsSave":
    case "savedLessonsList":
    case "savedLessonGet":
    case "savedLessonSave":
    case "savedLessonDelete":
      return prepareAccountOperation(database, operation);
    case "dailySessionGetById":
    case "dailySessionGetByUserDate":
    case "dailySessionGetByPracticeRun":
    case "lessonProgressList":
    case "lessonProgressSave":
      return prepareLearningOperation(database, operation);
    case "practiceRunGet":
    case "attemptGetByIdempotency":
    case "attemptsGetByRun":
    case "attemptsGetByUserActivity":
    case "attemptSave":
      return preparePracticeOperation(database, operation);
    case "activityProgressGet":
    case "activityProgressSave":
    case "taxonomyProgressGet":
    case "taxonomyProgressSave":
    case "progressOverview":
    case "reviewGetByActivity":
    case "reviewGetDue":
    case "reviewGetUpcoming":
    case "reviewSave":
      return prepareProgressOperation(database, operation);
    case "authCreate":
    case "authFindOne":
    case "authFindMany":
    case "authCount":
    case "authUpdate":
    case "authUpdateMany":
    case "authDelete":
    case "authDeleteMany":
    case "authConsumeOne":
    case "authIncrementOne":
      return prepareAuthOperation(database, operation);
    case "dailySessionSave":
    case "practiceRunSave":
      throw new Error(`${operation.name} is a composite D1 operation`);
  }
}

export { prepareCompositeD1Operation } from "./composite-sql";
export type { PreparedOperation } from "./shared";
