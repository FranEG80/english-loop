import type { UserSettings } from "../../domain/user-settings";
import type { UserSettingsDto } from "@/core/models/types/settings";

/** Convierte settings de dominio a DTO seguro. */
export function toUserSettingsDto(settings: UserSettings): UserSettingsDto {
  return {
    locale: settings.locale,
    activeLevels: settings.activeLevels,
    dailyGoal: settings.dailyGoalActivities,
    reducedMotion: settings.reducedMotion,
  };
}
