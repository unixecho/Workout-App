// English dictionary — the source of truth for message keys. Every other
// locale must satisfy this shape (see he.ts). Messages that need values are
// functions, not templates, so word order stays free per language.
export const en = {
  tabs: {
    today: "Today",
    plan: "Plan",
    stats: "Stats",
    friends: "Friends",
    profile: "Profile",
  },
  common: {
    save: "Save",
    saving: "Saving…",
    cancel: "Cancel",
    remove: "Remove",
    edited: "• Edited",
    minutes: (n: number) => `~${n} min`,
  },
  editor: {
    warmupPrefix: "Warm-up · ",
    cooldownPrefix: "Cool-down · ",
    sets: "Sets",
    reps: "Reps",
    seconds: "Seconds",
    restBetweenSets: "Rest between sets",
    swapWarmup: "Swap warm-up",
    addExercise: "＋ Add exercise",
    longerThanUsual: (min: number, usual: number) => `~${min} min — longer than your usual ${usual}`,
  },
  profile: {
    language: "Language",
    languageNames: { en: "English", he: "עברית" },
  },
};

export type Dictionary = typeof en;
