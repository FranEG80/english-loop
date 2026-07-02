import type { Locale } from "../models/locale";

export interface LocalePort {
  getLocale(): Promise<Locale>;
  setLocale(locale: Locale): Promise<void>;
}
