import { cookies } from "next/headers";
import { asLocale, getDictionary, LOCALE_COOKIE, type Locale } from "./index";

/** The viewer's locale, from the repup-locale cookie (server components). */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  return asLocale(store.get(LOCALE_COOKIE)?.value);
}

/** Locale + dictionary in one call for server components. */
export async function getI18n() {
  const locale = await getLocale();
  return { locale, t: getDictionary(locale) };
}
