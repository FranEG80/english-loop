import { describe, expect, it } from "vitest";
import {
  DEFAULT_DAILY_GOAL_ACTIVITIES,
  DEFAULT_DAILY_GOAL_LESSONS,
  DEFAULT_TIMEZONE,
  UserSettings,
  isSupportedTimezone,
} from "./user-settings";

const valid = {
  userId: "user-1",
  locale: "en" as const,
  activeLevels: ["B1"] as ("B1" | "B2")[],
  dailyGoalLessons: 2,
  dailyGoalActivities: 12,
  timezone: "Europe/Madrid",
  reducedMotion: true,
};

describe("UserSettings", () => {
  it("recognizes supported IANA timezones and rejects invalid values", () => {
    expect(isSupportedTimezone("Europe/Madrid")).toBe(true);
    expect(isSupportedTimezone("Not/A/Timezone")).toBe(false);
  });

  it("creates defaults, exposes defensive copies and applies valid patches", () => {
    const defaults = UserSettings.defaults("user-1");
    expect(defaults.toDto()).toMatchObject({
      userId: "user-1",
      dailyGoalLessons: DEFAULT_DAILY_GOAL_LESSONS,
      dailyGoalActivities: DEFAULT_DAILY_GOAL_ACTIVITIES,
      timezone: DEFAULT_TIMEZONE,
    });

    const settings = UserSettings.create(valid);
    expect(settings.userId).toBe("user-1");
    expect(settings.locale).toBe("en");
    expect(settings.activeLevels).toEqual(["B1"]);
    expect(settings.dailyGoalLessons).toBe(2);
    expect(settings.dailyGoalActivities).toBe(12);
    expect(settings.timezone).toBe("Europe/Madrid");
    expect(settings.reducedMotion).toBe(true);

    const levels = settings.activeLevels;
    levels.push("B2");
    expect(settings.activeLevels).toEqual(["B1"]);

    const updated = settings.update({ activeLevels: ["B1", "B2"], timezone: "UTC" });
    expect(updated.activeLevels).toEqual(["B1", "B2"]);
    expect(updated.timezone).toBe("UTC");
    expect(settings.timezone).toBe("Europe/Madrid");
  });

  it.each([
    ["requires at least one level", { activeLevels: [] }, "At least one active level"],
    ["rejects unknown levels", { activeLevels: ["C1"] }, "Active levels are invalid"],
    ["requires integer goals", { dailyGoalLessons: 1.5 }, "Daily goals must be integers"],
    ["rejects negative goals", { dailyGoalActivities: -1 }, "Daily goals cannot be negative"],
    ["rejects unsupported timezones", { timezone: "Not/A/Timezone" }, "Unsupported timezone"],
  ])("validates invariants: %s", (_name, patch, message) => {
    expect(() => UserSettings.create({ ...valid, ...patch } as typeof valid)).toThrow(message);
  });
});
