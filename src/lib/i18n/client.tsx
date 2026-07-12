"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { DEFAULT_LOCALE, getDictionary, type Dictionary, type Locale } from "./index";

// Only the locale string crosses the server→client boundary (dictionaries
// contain message functions, which aren't serializable). Both dictionaries
// are tiny, so bundling them client-side costs almost nothing.
const I18nContext = createContext<{ locale: Locale; t: Dictionary }>({
  locale: DEFAULT_LOCALE,
  t: getDictionary(DEFAULT_LOCALE),
});

export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const value = useMemo(() => ({ locale, t: getDictionary(locale) }), [locale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/** Locale + dictionary for client components: `const { t } = useI18n()`. */
export function useI18n() {
  return useContext(I18nContext);
}
