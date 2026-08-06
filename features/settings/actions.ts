"use server";

import { revalidatePath } from "next/cache";
import {
  getLocalePort,
  getSettingsPort,
} from "@/adapters/adapter-factory";
import type { CefrLevel, Locale } from "@/core/models";

export interface SettingsActionState {
  error?: string;
  success?: string;
}

export async function updateSettingsAction(
  _prevState: SettingsActionState | undefined,
  formData: FormData,
): Promise<SettingsActionState> {
  const locale: Locale = formData.get("locale") === "en" ? "en" : "es";
  const activeLevels = formData
    .getAll("activeLevels")
    .filter((value): value is CefrLevel => value === "B1" || value === "B2");
  const dailyGoal = Math.min(
    20,
    Math.max(1, Number(formData.get("dailyGoal") ?? 3)),
  );
  try {
    await Promise.all([
      getSettingsPort().updateSettings({
        locale,
        activeLevels: activeLevels.length > 0 ? activeLevels : ["B1"],
        dailyGoal,
        reducedMotion: formData.get("reducedMotion") === "on",
      }),
      getLocalePort().setLocale(locale),
    ]);
    revalidatePath("/", "layout");

    return {
      success: locale === "es" ? "Ajustes guardados." : "Settings saved.",
    };
  } catch {
    return {
      error:
        locale === "es"
          ? "No se pudieron guardar los ajustes. Inténtalo de nuevo."
          : "Settings could not be saved. Please try again.",
    };
  }
}

export async function resetSettingsAction() {
  await Promise.all([
    getSettingsPort().resetMockData(),
    getLocalePort().setLocale("es"),
  ]);
  revalidatePath("/", "layout");
}
