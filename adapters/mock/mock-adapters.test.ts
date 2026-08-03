import { beforeEach, describe, expect, it } from "vitest";
import { dailySessionMockAdapter } from "./daily-session-mock-adapter";
import { focusedPracticeMockAdapter } from "./focused-practice-mock-adapter";
import { learningContentMockAdapter } from "./learning-content-mock-adapter";
import { progressMockAdapter } from "./progress-mock-adapter";
import { settingsMockAdapter } from "./settings-mock-adapter";
import { mockDefaultSettings } from "./data/settings";

describe("mock port adapters", () => {
  beforeEach(async () => {
    await settingsMockAdapter.resetMockData();
  });

  it("implements learning content filters and null lookups", async () => {
    const b2 = await learningContentMockAdapter.listLessons({ level: "B2" });
    expect(b2.every((lesson) => lesson.level === "B2")).toBe(true);
    expect(await learningContentMockAdapter.getLessonById("missing")).toBeNull();
    const scoped = await learningContentMockAdapter.listActivities({ taxonomyNodeId: "grammar.conditionals" });
    expect(scoped.every((item) => item.taxonomyNodeId.startsWith("grammar.conditionals"))).toBe(true);
    expect((await learningContentMockAdapter.getTaxonomyTree()).length).toBeGreaterThan(0);
  });

  it("implements progress and settings ports with isolated state", async () => {
    expect((await progressMockAdapter.getOverview()).totalActivitiesCompleted).toBeGreaterThan(0);
    expect((await progressMockAdapter.getReviewQueue()).dueItems.length).toBeGreaterThan(0);
    expect(await progressMockAdapter.getTaxonomyProgress("topic")).toEqual({ taxonomyNodeId: "topic", attemptsCount: 0, correctCount: 0, accuracyRate: 0 });
    expect(await settingsMockAdapter.getSettings()).toEqual(mockDefaultSettings);
    await settingsMockAdapter.updateSettings({ locale: "en", reducedMotion: true });
    expect(await settingsMockAdapter.getSettings()).toMatchObject({ locale: "en", reducedMotion: true });
    await settingsMockAdapter.resetMockData();
    expect(await settingsMockAdapter.getSettings()).toEqual(mockDefaultSettings);
  });

  it("runs a daily session through practice and completion", async () => {
    const session = await dailySessionMockAdapter.getTodaySession("Europe/Madrid");
    expect(session.id).toMatch(/^daily-/u);
    expect(await dailySessionMockAdapter.getTodaySession("Europe/Madrid")).toBe(session);
    const firstActivity = session.activityIds[0];
    const feedback = await dailySessionMockAdapter.submitDailyAttempt(session.id, {
      activityId: firstActivity,
      response: { kind: "text", value: "went" },
    });
    expect(feedback.activityId).toBe(firstActivity);
    expect((await dailySessionMockAdapter.startDailyPractice(session.id)).status).toBe("practice");
    expect((await dailySessionMockAdapter.completeDailySession(session.id)).status).toBe("completed");
    await expect(dailySessionMockAdapter.submitDailyAttempt("missing", { activityId: firstActivity, response: { kind: "text", value: "x" } })).rejects.toThrow(/No existe la sesión/iu);
  });

  it("creates focused runs, advances them and summarizes results", async () => {
    const availability = await focusedPracticeMockAdapter.getScopeAvailability("grammar.conditionals");
    expect(availability).toHaveLength(3);
    const run = await focusedPracticeMockAdapter.createRun({ taxonomyNodeId: "grammar.conditionals", level: "B1", sessionSize: 5 });
    expect(run.id).toMatch(/^run-/u);
    expect(run.activityIds.length).toBeGreaterThan(0);
    const activityId = run.activityIds[0];
    await focusedPracticeMockAdapter.submitRunAttempt(run.id, { activityId, response: { kind: "text", value: "wrong" } });
    const summary = await focusedPracticeMockAdapter.getRunSummary(run.id);
    expect(summary.runId).toBe(run.id);
    expect(summary.incorrectCount).toBe(1);
    await expect(focusedPracticeMockAdapter.getRunSummary("missing")).rejects.toThrow(/No existe la sesión/iu);
  });
});
