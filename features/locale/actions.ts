"use server";

import { revalidatePath } from "next/cache";
import { getLocalePort } from "@/adapters/adapter-factory";
import type { Locale } from "@/core/models";

export async function setLocaleAction(
  locale: Locale,
  pathname: string,
): Promise<void> {
  await getLocalePort().setLocale(locale);
  revalidatePath(pathname);
}
