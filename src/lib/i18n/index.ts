import { en, type Dictionary } from "./dictionaries/en";
import { he } from "./dictionaries/he";

export type Locale = "en" | "he";
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "repup-locale";

export const isRtl = (locale: Locale) => locale === "he";

export function asLocale(value: string | undefined | null): Locale {
  return value === "he" ? "he" : DEFAULT_LOCALE;
}

export function getDictionary(locale: Locale): Dictionary {
  return locale === "he" ? he : en;
}

export type { Dictionary };
