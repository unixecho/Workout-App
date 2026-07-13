import { en, type Dictionary } from "./dictionaries/en";
import { he } from "./dictionaries/he";

export const LOCALES = ["he", "en"] as const;
export type Locale = (typeof LOCALES)[number];

// Hebrew is the home-market default: it only applies when the browser
// expresses no preference between Hebrew and English (see negotiateLocale),
// so English-preferring devices still land on English automatically.
export const DEFAULT_LOCALE: Locale = "he";
export const LOCALE_COOKIE = "repup-locale";

export const isRtl = (locale: Locale) => locale === "he";

/** BCP 47 tag used for all Intl formatting (dates, numbers). en-GB gives
 *  day-first dates, matching Israeli convention for English speakers too. */
export const localeTag = (locale: Locale) => (locale === "he" ? "he-IL" : "en-GB");

/** Strict parse of a stored/user-supplied locale; null when absent/unknown. */
export function asLocale(value: string | undefined | null): Locale | null {
  return value === "he" || value === "en" ? value : null;
}

/**
 * Pick the viewer's locale from an Accept-Language header. Highest-q
 * supported language wins ("iw" is the legacy tag Android still sends for
 * Hebrew); anything else falls back to the home-market default.
 */
export function negotiateLocale(header: string | null): Locale {
  if (!header) return DEFAULT_LOCALE;
  const prefs = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
      return {
        lang: tag.trim().toLowerCase().split("-")[0],
        q: q ? Number.parseFloat(q.slice(2)) || 0 : 1,
      };
    })
    .sort((a, b) => b.q - a.q);
  for (const { lang } of prefs) {
    if (lang === "he" || lang === "iw") return "he";
    if (lang === "en") return "en";
  }
  return DEFAULT_LOCALE;
}

/**
 * Weekday display order as indexes into Monday-first arrays (the storage
 * canon everywhere: 0 = Monday … 6 = Sunday). Israel's week runs
 * Sunday-Saturday, so Hebrew UIs reorder columns; the data model never
 * changes.
 */
export function weekdayDisplayOrder(locale: Locale): number[] {
  return locale === "he" ? [6, 0, 1, 2, 3, 4, 5] : [0, 1, 2, 3, 4, 5, 6];
}

export function getDictionary(locale: Locale): Dictionary {
  return locale === "he" ? he : en;
}

export type { Dictionary };
