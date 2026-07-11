import type { Dictionary } from "./en";

// Hebrew (עברית). RTL — the <html dir> flip comes from the locale, not from
// anything in here. Keep translations natural-app-Hebrew, not literal.
export const he: Dictionary = {
  tabs: {
    today: "היום",
    plan: "תוכנית",
    stats: "נתונים",
    friends: "חברים",
    profile: "פרופיל",
  },
  common: {
    save: "שמירה",
    saving: "שומר…",
    cancel: "ביטול",
    remove: "הסרה",
    edited: "• נערך",
    minutes: (n: number) => `~${n} דק׳`,
  },
  editor: {
    warmupPrefix: "חימום · ",
    cooldownPrefix: "שחרור · ",
    sets: "סטים",
    reps: "חזרות",
    seconds: "שניות",
    restBetweenSets: "מנוחה בין סטים",
    swapWarmup: "החלפת חימום",
    addExercise: "＋ הוספת תרגיל",
    longerThanUsual: (min: number, usual: number) => `~${min} דק׳ — ארוך מהרגיל שלך (${usual})`,
  },
  profile: {
    language: "שפה",
    languageNames: { en: "English", he: "עברית" },
  },
};
