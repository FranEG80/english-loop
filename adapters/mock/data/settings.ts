import type { UserSettingsDto } from "@/core/models";

export const mockDefaultSettings: UserSettingsDto = {
  locale: "es",
  activeLevels: ["B1", "B2"],
  dailyGoal: 3,
  reducedMotion: false,
};
