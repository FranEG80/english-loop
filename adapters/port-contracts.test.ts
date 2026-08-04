import { describe, expect, it } from "vitest";
import { authMockAdapter } from "./mock/auth-mock-adapter";
import { dailySessionMockAdapter } from "./mock/daily-session-mock-adapter";
import { focusedPracticeMockAdapter } from "./mock/focused-practice-mock-adapter";
import { learningContentMockAdapter } from "./mock/learning-content-mock-adapter";
import { progressMockAdapter } from "./mock/progress-mock-adapter";
import { settingsMockAdapter } from "./mock/settings-mock-adapter";
import { localeCookiePortAdapter } from "./browser/locale-port-adapter";

describe("core port implementations", () => {
  it.each([
    ["AuthPort", authMockAdapter, ["getSession", "login", "register", "updateProfile", "changePassword", "logout"]],
    ["DailySessionPort", dailySessionMockAdapter, ["getTodaySession", "startDailyPractice", "submitDailyAttempt", "completeDailySession"]],
    ["FocusedPracticePort", focusedPracticeMockAdapter, ["getScopeAvailability", "createRun", "submitRunAttempt", "getRunSummary"]],
    ["LearningContentPort", learningContentMockAdapter, ["listLessons", "getLessonById", "listActivities", "getActivityById", "getTaxonomyTree"]],
    ["ProgressPort", progressMockAdapter, ["getOverview", "getReviewQueue", "getTaxonomyProgress", "getActivityHistory"]],
    ["SettingsPort", settingsMockAdapter, ["getSettings", "updateSettings", "resetMockData"]],
    ["LocalePort", localeCookiePortAdapter, ["getLocale", "setLocale"]],
  ])("implements the complete %s surface", (_name, implementation, methods) => {
    for (const method of methods as string[]) expect((implementation as unknown as Record<string, unknown>)[method]).toBeTypeOf("function");
  });
});
