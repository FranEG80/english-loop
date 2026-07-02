import type { LocalePort } from "@/core/ports";
import { readLocaleCookie, writeLocaleCookie } from "./locale-cookie-server";

/**
 * Implementación de `LocalePort` para Server Components/Server Actions.
 * No forma parte del par mock/REST: el idioma siempre vive en una cookie,
 * tanto ahora como cuando exista backend.
 */
export const localeCookiePortAdapter: LocalePort = {
  getLocale: readLocaleCookie,
  setLocale: writeLocaleCookie,
};
