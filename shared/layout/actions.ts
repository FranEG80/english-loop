"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  getAuthPort,
  getLocalePort,
} from "@/adapters/adapter-factory";
import type { Locale } from "@/core/models";

export async function logoutAction(): Promise<void> {
  await getAuthPort().logout();
  redirect("/");
}

export async function setLocaleAction(
  locale: Locale,
  pathname: string,
): Promise<void> {
  await getLocalePort().setLocale(locale);
  revalidatePath(pathname);
}
