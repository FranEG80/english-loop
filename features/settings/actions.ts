"use server";

import { revalidatePath } from "next/cache";
import {
  getLocalePort,
  getSettingsPort,
} from "@/adapters/adapter-factory";
import type { CefrLevel, Locale } from "@/core/models";

export async function updateSettingsAction(formData: FormData) {
  const locale: Locale = formData.get("locale") === "en" ? "en" : "es";
  const activeLevels = formData
    .getAll("activeLevels")
    .filter((value): value is CefrLevel => value === "B1" || value === "B2");
  const dailyGoal = Math.min(
    20,
    Math.max(1, Number(formData.get("dailyGoal") ?? 3)),
  );
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
}

export async function resetSettingsAction() {
  await Promise.all([
    getSettingsPort().resetMockData(),
    getLocalePort().setLocale("es"),
  ]);
  revalidatePath("/", "layout");
}
