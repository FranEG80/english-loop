import { describe, expect, it } from "vitest";
import { UserSettings } from "@/core/account/domain/user-settings";
import { getOrCreateDailySession } from "./get-or-create-daily-session";
import { DailySessionPlanner } from "../../domain/daily-session-planner";
import {
  actor,
  catalog,
  clock,
  collectEvents,
  identity,
  ids,
  lessonProgress,
  MemorySessions,
  MemorySettings,
  random,
} from "@/test/support/core-fakes";

describe("getOrCreateDailySession", () => {
  it("uses the persisted IANA timezone and is idempotent", async () => {
    const settings = new MemorySettings();
    await settings.save(
      UserSettings.create({
        ...UserSettings.defaults(actor.userId).toDto(),
        timezone: "Europe/Madrid",
        dailyGoalLessons: 1,
      }),
    );
    const sessions = new MemorySessions();
    const { dispatcher } = collectEvents();

    const first = await getOrCreateDailySession(
      identity,
      sessions,
      settings,
      catalog,
      lessonProgress,
      new DailySessionPlanner(random),
      ids,
      clock,
      dispatcher,
      "v1",
      { timezone: "UTC", date: "1999-01-01" },
    );
    const second = await getOrCreateDailySession(
      identity,
      sessions,
      settings,
      catalog,
      lessonProgress,
      new DailySessionPlanner(random),
      ids,
      clock,
      dispatcher,
      "v1",
      { timezone: "UTC" },
    );

    expect(first.date).toBe("2026-08-04");
    expect(second.id).toBe(first.id);
  });

  it("recovers the winner when a concurrent creator violates the unique date constraint", async () => {
    const settings = new MemorySettings();
    const sessions = new MemorySessions();
    let firstSave = true;
    const originalSave = sessions.save.bind(sessions);
    sessions.save = async (value) => {
      if (firstSave) {
        firstSave = false;
        await originalSave(value);
        throw new Error("unique constraint");
      }
      return originalSave(value);
    };

    const result = await getOrCreateDailySession(
      identity,
      sessions,
      settings,
      catalog,
      lessonProgress,
      new DailySessionPlanner(random),
      ids,
      clock,
      collectEvents().dispatcher,
      "v1",
      { timezone: "UTC" },
    );

    expect(result.date).toBe("2026-08-03");
  });
});
