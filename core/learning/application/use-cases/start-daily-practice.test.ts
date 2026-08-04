import { describe, expect, it } from "vitest";
import { startDailyPractice } from "./start-daily-practice";
import { DailySession } from "../../domain/daily-session";
import { DailyPracticePlanner } from "../../domain/daily-practice-planner";
import {
  catalog,
  actor,
  clock,
  collectEvents,
  identity,
  ids,
  MemoryRuns,
  MemorySessions,
  MemorySettings,
  random,
  makeDailySession,
  makeDailyRun,
} from "@/test/support/core-fakes";
import { UserSettings } from "@/core/account/domain/user-settings";

describe("startDailyPractice", () => {
  it("creates the DAILY run only after lesson phase completion", async () => {
    const sessions = new MemorySessions();
    const session = makeDailySession();
    session.completeLesson("lesson-1", clock.nowIso());
    await sessions.save(session);
    const runs = new MemoryRuns();
    const settings = new MemorySettings();
    settings.value = UserSettings.defaults(actor.userId).update({
      dailyGoalActivities: 2,
    });

    const result = await startDailyPractice(
      identity,
      { transaction: async (work) => work() },
      sessions,
      runs,
      settings,
      catalog,
      new DailyPracticePlanner(random),
      ids,
      clock,
      collectEvents().dispatcher,
      "v1",
      session.id,
    );

    expect(result.run.mode).toBe("DAILY");
    expect(result.run.activityIds).toEqual(["activity-1", "activity-2"]);
    expect((await sessions.findById(session.id))?.status).toBe("practice");
  });

  it("returns the existing run instead of creating a second one", async () => {
    const sessions = new MemorySessions();
    const session = makeDailySession("session-existing", "practice");
    session.attachPracticeRun("run-existing");
    await sessions.save(session);
    const runs = new MemoryRuns();
    const existing = makeDailyRun(session.id, "run-existing");
    runs.values.set(existing.id, existing);

    const result = await startDailyPractice(
      identity,
      { transaction: async (work) => work() },
      sessions,
      runs,
      new MemorySettings(),
      catalog,
      new DailyPracticePlanner(random),
      ids,
      clock,
      collectEvents().dispatcher,
      "v1",
      session.id,
    );

    expect(result.run.id).toBe(existing.id);
    expect(runs.values.size).toBe(1);
  });

  it("rejects missing and foreign sessions and creates a run for an unstarted session", async () => {
    await expect(startDailyPractice(identity, { transaction: async (work) => work() }, new MemorySessions(), new MemoryRuns(), new MemorySettings(), catalog, new DailyPracticePlanner(random), ids, clock, collectEvents().dispatcher, "v1", "missing-session")).rejects.toMatchObject({ message: "Daily session not found: missing-session" });
    const foreignSessions = new MemorySessions();
    await foreignSessions.save(DailySession.create({ id: "foreign-session", userId: "other-user", date: "2026-08-04", status: "lesson", datasetVersion: "v1", seed: "seed", lessons: [], practiceRunId: null, createdAt: clock.nowIso() }));
    await expect(startDailyPractice(identity, { transaction: async (work) => work() }, foreignSessions, new MemoryRuns(), new MemorySettings(), catalog, new DailyPracticePlanner(random), ids, clock, collectEvents().dispatcher, "v1", "foreign-session")).rejects.toMatchObject({ message: "Cannot access another user's daily session" });
    const sessions = new MemorySessions();
    const session = makeDailySession("disappeared-run", "lesson");
    session.completeLesson("lesson-1", clock.nowIso());
    await sessions.save(session);
    const retrySettings = new MemorySettings();
    retrySettings.value = UserSettings.defaults(actor.userId).update({ dailyGoalActivities: 2 });
    const result = await startDailyPractice(identity, { transaction: async (work) => work() }, sessions, new MemoryRuns(), retrySettings, catalog, new DailyPracticePlanner(random), ids, clock, collectEvents().dispatcher, "v1", session.id);
    expect(result.run.mode).toBe("DAILY");
  });
});
