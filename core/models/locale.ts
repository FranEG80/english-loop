export type Locale = "es" | "en";

export const LOCALES: readonly Locale[] = ["es", "en"];

export const DEFAULT_LOCALE: Locale = "es";

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/** Texto de interfaz o de navegación que sí cambia con el selector de idioma. */
export type LocalizedText = Record<Locale, string>;
