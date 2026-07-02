import "server-only";
import { cookies } from "next/headers";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/core/models";
import { LOCALE_COOKIE_NAME } from "./cookie-names";

const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

/** Lee el idioma persistido en cookie; usa español si no existe o es inválido. */
export async function readLocaleCookie(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE_NAME)?.value;
  return value && isLocale(value) ? value : DEFAULT_LOCALE;
}

/** Solo se puede invocar desde un Server Action o un Route Handler. */
export async function writeLocaleCookie(locale: Locale): Promise<void> {
  const store = await cookies();
  store.set(LOCALE_COOKIE_NAME, locale, {
    sameSite: "lax",
    path: "/",
    maxAge: ONE_YEAR_IN_SECONDS,
  });
}
