import { describe, expect, it } from "vitest";
import { UserSettings } from "../../domain/user-settings";
import { toUserSettingsDto } from "./user-settings-mapper";

describe("toUserSettingsDto", () => {
  it("maps domain names to the public settings contract", () => {
    const settings = UserSettings.create({
      userId: "user-1",
      locale: "en",
      activeLevels: ["B1", "B2"],
      dailyGoalLessons: 2,
      dailyGoalActivities: 12,
      timezone: "Europe/Madrid",
      reducedMotion: true,
    });
    expect(toUserSettingsDto(settings)).toEqual({
      locale: "en",
      activeLevels: ["B1", "B2"],
      dailyGoal: 12,
      reducedMotion: true,
    });
  });
});
