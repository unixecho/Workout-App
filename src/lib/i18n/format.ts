import { localeTag, type Locale } from "./index";

/**
 * All date/number rendering goes through these so server and client agree
 * on the locale tag (passing `undefined` to toLocale* uses the runtime's
 * default and can hydrate differently than the server rendered).
 */
export function formatDate(locale: Locale, date: string | Date, opts?: Intl.DateTimeFormatOptions) {
  return new Date(date).toLocaleDateString(localeTag(locale), opts);
}

export function formatNumber(locale: Locale, n: number) {
  return n.toLocaleString(localeTag(locale));
}
