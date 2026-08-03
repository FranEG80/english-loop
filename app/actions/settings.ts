"use server";

import { revalidatePath } from "next/cache";
import { compositionRoot } from "@/server/infrastructure/composition/composition-root";
import { updateUserSettings } from "@/core/account/application/use-cases/update-user-settings";
import { toUserSettingsDto } from "@/core/account/application/mappers/user-settings-mapper";
import type { CefrLevel } from "@/core/models/level";
import type { Locale } from "@/core/models/locale";

export interface UpdateSettingsInput {
  locale?: Locale;
  activeLevels?: CefrLevel[];
  dailyGoalLessons?: number;
  dailyGoalActivities?: number;
  timezone?: string;
  reducedMotion?: boolean;
}

/** Server Action para actualizar los settings del usuario. */
export async function updateSettingsAction(input: UpdateSettingsInput) {
  const settings = await updateUserSettings(
    compositionRoot.identity,
    compositionRoot.userSettingsRepository,
    input,
  );
  revalidatePath("/settings");
  return toUserSettingsDto(settings);
}
