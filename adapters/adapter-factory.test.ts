import { afterEach, describe, expect, it } from "vitest";
import { getAuthPort, getDailySessionPort, getFocusedPracticePort, getLearningContentPort, getLocalePort, getProgressPort, getSettingsPort } from "./adapter-factory";
import { dailySessionMockAdapter } from "./mock/daily-session-mock-adapter";
import { focusedPracticeMockAdapter } from "./mock/focused-practice-mock-adapter";
import { learningContentMockAdapter } from "./mock/learning-content-mock-adapter";
import { progressMockAdapter } from "./mock/progress-mock-adapter";
import { settingsMockAdapter } from "./mock/settings-mock-adapter";
import { authRestAdapter } from "./rest/auth-rest-adapter";
import { dailySessionRestAdapter } from "./rest/daily-session-rest-adapter";
import { focusedPracticeRestAdapter } from "./rest/focused-practice-rest-adapter";
import { learningContentRestAdapter } from "./rest/learning-content-rest-adapter";
import { progressRestAdapter } from "./rest/progress-rest-adapter";
import { settingsRestAdapter } from "./rest/settings-rest-adapter";

afterEach(() => {
  delete process.env.NEXT_PUBLIC_DATA_SOURCE;
});

describe("adapter factory", () => {
  it("keeps authentication real even when content mocks are selected", () => {
    expect(getAuthPort()).toBe(authRestAdapter);
    expect(getDailySessionPort()).toBe(dailySessionMockAdapter);
    expect(getFocusedPracticePort()).toBe(focusedPracticeMockAdapter);
    expect(getLearningContentPort()).toBe(learningContentMockAdapter);
    expect(getProgressPort()).toBe(progressMockAdapter);
    expect(getSettingsPort()).toBe(settingsMockAdapter);
    expect(getLocalePort().getLocale).toBeTypeOf("function");
  });

  it("selects every REST data port explicitly", () => {
    process.env.NEXT_PUBLIC_DATA_SOURCE = "rest";
    expect(getAuthPort()).toBe(authRestAdapter);
    expect(getDailySessionPort()).toBe(dailySessionRestAdapter);
    expect(getFocusedPracticePort()).toBe(focusedPracticeRestAdapter);
    expect(getLearningContentPort()).toBe(learningContentRestAdapter);
    expect(getProgressPort()).toBe(progressRestAdapter);
    expect(getSettingsPort()).toBe(settingsRestAdapter);
  });
});
