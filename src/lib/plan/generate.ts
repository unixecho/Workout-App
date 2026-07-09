/**
 * v1 plan generator — deterministic, rule-based templates only, no LLM calls
 * (locked in CLAUDE.md). Picks a template pool by goal, then cycles it
 * across the user's active weekdays. This is intentionally simple: it
 * produces a plausible, varied week shape. Real exercise selection inside
 * each session waits on the exercise library being seeded (see
 * docs/TD.md — session_exercises).
 */

export type Goal =
  | "lose_weight"
  | "build_muscle"
  | "get_stronger"
  | "endurance"
  | "stay_healthy";

export type Equipment = "none" | "basic" | "full_gym";

export interface DayTemplate {
  title: string;
  muscles: string[];
  minutes: number;
}

export interface GeneratedDay {
  dayOfWeek: number; // 0 = Monday .. 6 = Sunday
  isRestDay: boolean;
  sessionTitle: string | null;
  focusMuscles: string[];
  estDurationMin: number | null;
}

const TEMPLATE_POOLS: Record<Goal, DayTemplate[]> = {
  build_muscle: [
    { title: "Push — Chest & Triceps", muscles: ["Chest", "Triceps", "Delts"], minutes: 52 },
    { title: "Pull — Back & Biceps", muscles: ["Back", "Biceps"], minutes: 55 },
    { title: "Legs — Quads & Glutes", muscles: ["Quads", "Glutes"], minutes: 58 },
    { title: "Upper — Shoulders & Arms", muscles: ["Delts", "Arms"], minutes: 45 },
    { title: "Full Body — Strength", muscles: ["Compound", "Core"], minutes: 60 },
  ],
  get_stronger: [
    { title: "Legs — Squat Focus", muscles: ["Quads", "Glutes"], minutes: 60 },
    { title: "Push — Bench Focus", muscles: ["Chest", "Triceps"], minutes: 55 },
    { title: "Pull — Deadlift Focus", muscles: ["Back", "Hamstrings"], minutes: 60 },
    { title: "Full Body — Accessory", muscles: ["Compound", "Core"], minutes: 45 },
  ],
  lose_weight: [
    { title: "Conditioning — Intervals", muscles: ["Cardio", "Core"], minutes: 35 },
    { title: "Full Body — Strength", muscles: ["Compound", "Core"], minutes: 50 },
    { title: "Push — Chest & Triceps", muscles: ["Chest", "Triceps"], minutes: 45 },
    { title: "Pull — Back & Biceps", muscles: ["Back", "Biceps"], minutes: 45 },
    { title: "Legs — Quads & Glutes", muscles: ["Quads", "Glutes"], minutes: 50 },
  ],
  endurance: [
    { title: "Conditioning — Intervals", muscles: ["Cardio", "Core"], minutes: 40 },
    { title: "Conditioning — Steady State", muscles: ["Cardio"], minutes: 45 },
    { title: "Full Body — Strength", muscles: ["Compound", "Core"], minutes: 40 },
    { title: "Mobility & Core", muscles: ["Core", "Mobility"], minutes: 30 },
  ],
  stay_healthy: [
    { title: "Full Body — Strength", muscles: ["Compound", "Core"], minutes: 45 },
    { title: "Mobility & Core", muscles: ["Core", "Mobility"], minutes: 30 },
    { title: "Push — Chest & Triceps", muscles: ["Chest", "Triceps"], minutes: 40 },
    { title: "Pull — Back & Biceps", muscles: ["Back", "Biceps"], minutes: 40 },
    { title: "Conditioning — Intervals", muscles: ["Cardio", "Core"], minutes: 35 },
  ],
};

/** `activeDays[i]` — true if the user trains on weekday `i` (0=Mon..6=Sun). */
export function generateWeek(goal: Goal, activeDays: boolean[]): GeneratedDay[] {
  const pool = TEMPLATE_POOLS[goal];
  let templateIndex = 0;

  return activeDays.map((isActive, dayOfWeek) => {
    if (!isActive) {
      return {
        dayOfWeek,
        isRestDay: true,
        sessionTitle: null,
        focusMuscles: [],
        estDurationMin: null,
      };
    }
    const template = pool[templateIndex % pool.length];
    templateIndex += 1;
    return {
      dayOfWeek,
      isRestDay: false,
      sessionTitle: template.title,
      focusMuscles: template.muscles,
      estDurationMin: template.minutes,
    };
  });
}
