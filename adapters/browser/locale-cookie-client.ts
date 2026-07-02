"use client";

import { DEFAULT_LOCALE, isLocale, type Locale } from "@/core/models";
import { LOCALE_COOKIE_NAME } from "./cookie-names";

const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

/** Lectura de la cookie de idioma desde el navegador (islas cliente). */
export function readLocaleCookieClient(): Locale {
  if (typeof document === "undefined") return DEFAULT_LOCALE;
  const match = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${LOCALE_COOKIE_NAME}=`));
  const value = match?.split("=")[1];
  return value && isLocale(value) ? value : DEFAULT_LOCALE;
}

/** Escritura de la cookie de idioma desde el navegador (islas cliente). */
export function writeLocaleCookieClient(locale: Locale): void {
  if (typeof document === "undefined") return;
  document.cookie = `${LOCALE_COOKIE_NAME}=${locale}; path=/; max-age=${ONE_YEAR_IN_SECONDS}; samesite=lax`;
}
