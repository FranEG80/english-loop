import type { IdentityPort } from "../../ports/identity-port";
import type { UserSettingsRepository } from "../../ports/user-settings-repository";
import { UserSettings } from "../../domain/user-settings";
import type { CefrLevel } from "@/core/models/level";
import type { Locale } from "@/core/models/locale";

export interface UpdateUserSettingsInput {
  locale?: Locale;
  activeLevels?: CefrLevel[];
  dailyGoalLessons?: number;
  dailyGoalActivities?: number;
  timezone?: string;
  reducedMotion?: boolean;
}

/** Actualiza los settings del usuario autenticado. */
export async function updateUserSettings(
  identity: IdentityPort,
  repository: UserSettingsRepository,
  input: UpdateUserSettingsInput,
): Promise<UserSettings> {
  const actor = await identity.requireActor();
  const current =
    (await repository.findByUserId(actor.userId)) ??
    UserSettings.defaults(actor.userId);

  const updated = current.update({
    ...(input.locale !== undefined ? { locale: input.locale } : {}),
    ...(input.activeLevels !== undefined
      ? { activeLevels: input.activeLevels }
      : {}),
    ...(input.dailyGoalLessons !== undefined
      ? { dailyGoalLessons: input.dailyGoalLessons }
      : {}),
    ...(input.dailyGoalActivities !== undefined
      ? { dailyGoalActivities: input.dailyGoalActivities }
      : {}),
    ...(input.timezone !== undefined ? { timezone: input.timezone } : {}),
    ...(input.reducedMotion !== undefined
      ? { reducedMotion: input.reducedMotion }
      : {}),
  });

  await repository.save(updated);
  return updated;
}
