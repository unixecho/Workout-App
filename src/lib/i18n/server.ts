import { cookies, headers } from "next/headers";
import { asLocale, getDictionary, negotiateLocale, LOCALE_COOKIE, type Locale } from "./index";

/**
 * The viewer's locale (server components): explicit choice (cookie) wins,
 * otherwise negotiated from Accept-Language. No cookie is written during
 * negotiation so an OS language change keeps working until the user picks
 * a language by hand in Profile.
 */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const chosen = asLocale(store.get(LOCALE_COOKIE)?.value);
  if (chosen) return chosen;
  const head = await headers();
  return negotiateLocale(head.get("accept-language"));
}

/** Locale + dictionary in one call for server components. */
export async function getI18n() {
  const locale = await getLocale();
  return { locale, t: getDictionary(locale) };
}
