import type { Locale } from "./locale";
import type { CefrLevel } from "./level";

export interface UserSettingsDto {
  locale: Locale;
  activeLevels: CefrLevel[];
  dailyGoal: number;
  reducedMotion: boolean;
}
