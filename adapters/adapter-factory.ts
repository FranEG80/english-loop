import type {
  AuthPort,
  DailySessionPort,
  FocusedPracticePort,
  LearningContentPort,
  LocalePort,
  ProgressPort,
  SettingsPort,
} from "@/core/ports";
import { authMockAdapter } from "./mock/auth-mock-adapter";
import { learningContentMockAdapter } from "./mock/learning-content-mock-adapter";
import { dailySessionMockAdapter } from "./mock/daily-session-mock-adapter";
import { focusedPracticeMockAdapter } from "./mock/focused-practice-mock-adapter";
import { progressMockAdapter } from "./mock/progress-mock-adapter";
import { settingsMockAdapter } from "./mock/settings-mock-adapter";
import { authRestAdapter } from "./rest/auth-rest-adapter";
import { learningContentRestAdapter } from "./rest/learning-content-rest-adapter";
import { dailySessionRestAdapter } from "./rest/daily-session-rest-adapter";
import { focusedPracticeRestAdapter } from "./rest/focused-practice-rest-adapter";
import { progressRestAdapter } from "./rest/progress-rest-adapter";
import { settingsRestAdapter } from "./rest/settings-rest-adapter";
import { localeCookiePortAdapter } from "./browser/locale-port-adapter";

type DataSource = "mock" | "rest";

/**
 * Selecciona la implementación de cada puerto. Hasta que exista backend,
 * `NEXT_PUBLIC_DATA_SOURCE` debe permanecer sin definir (o en "mock"): el
 * modo "rest" está preparado pero desactivado en la práctica, porque no hay
 * Route Handlers en `/api/v1` que lo respondan todavía.
 *
 * Ningún componente de `features/` o `app/` debe importar `adapters/mock`
 * ni `adapters/rest` directamente: siempre a través de estas factories.
 */
function getDataSource(): DataSource {
  return process.env.NEXT_PUBLIC_DATA_SOURCE === "rest" ? "rest" : "mock";
}

export function getAuthPort(): AuthPort {
  return getDataSource() === "rest" ? authRestAdapter : authMockAdapter;
}

export function getLearningContentPort(): LearningContentPort {
  return getDataSource() === "rest"
    ? learningContentRestAdapter
    : learningContentMockAdapter;
}

export function getDailySessionPort(): DailySessionPort {
  return getDataSource() === "rest"
    ? dailySessionRestAdapter
    : dailySessionMockAdapter;
}

export function getFocusedPracticePort(): FocusedPracticePort {
  return getDataSource() === "rest"
    ? focusedPracticeRestAdapter
    : focusedPracticeMockAdapter;
}

export function getProgressPort(): ProgressPort {
  return getDataSource() === "rest"
    ? progressRestAdapter
    : progressMockAdapter;
}

export function getSettingsPort(): SettingsPort {
  return getDataSource() === "rest"
    ? settingsRestAdapter
    : settingsMockAdapter;
}

/** El idioma siempre se resuelve mediante cookie, no mediante mock/REST. */
export function getLocalePort(): LocalePort {
  return localeCookiePortAdapter;
}
