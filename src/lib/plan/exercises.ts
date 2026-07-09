import type { Equipment, Goal } from "./generate";

/** Row shape of the `exercises` table (the fields selection cares about). */
export interface ExerciseRow {
  id: string;
  slug: string;
  name: string;
  muscle_groups: string[];
  equipment: Equipment;
  difficulty: number;
  adaptations: Record<string, { note: string; avoid: boolean }>;
}

export interface SessionExerciseInsert {
  exercise_id: string;
  order_index: number;
  is_warmup: boolean;
  is_cooldown: boolean;
  is_optional: boolean;
  dose_type: "reps" | "time";
  sets: number;
  reps_min: number | null;
  reps_max: number | null;
  seconds: number | null;
  rest_seconds: number;
}

const EQUIPMENT_TIER: Record<Equipment, number> = { none: 0, basic: 1, full_gym: 2 };

// Exercises tracked by time rather than reps (dose_type = 'time').
const TIMED_SLUGS = new Set([
  "plank", "bird-dog", "superman-hold", "dead-bug",
  "jumping-jacks", "mountain-climbers", "treadmill-intervals", "light-march",
  "arm-circles", "cat-cow", "hip-circles", "childs-pose",
]);

const WARMUP_SLUGS = ["light-march", "arm-circles", "cat-cow", "hip-circles"];
const COOLDOWN_SLUGS = ["childs-pose", "cat-cow", "hip-circles"];

/** True when this exercise must not be given to a user with these limitations. */
export function conflictsHard(ex: ExerciseRow, limitations: string[]): boolean {
  return limitations.some((tag) => ex.adaptations?.[tag.toLowerCase()]?.avoid === true);
}

/** The adaptation note to surface (amber block) for this user, if any. */
export function adaptationNote(ex: ExerciseRow, limitations: string[]): string | null {
  for (const tag of limitations) {
    const a = ex.adaptations?.[tag.toLowerCase()];
    if (a && !a.avoid) return a.note;
  }
  return null;
}

function doseFor(ex: ExerciseRow, goal: Goal): Pick<SessionExerciseInsert, "dose_type" | "sets" | "reps_min" | "reps_max" | "seconds" | "rest_seconds"> {
  if (TIMED_SLUGS.has(ex.slug)) {
    const cardio = ex.muscle_groups.includes("Cardio");
    return { dose_type: "time", sets: 3, reps_min: null, reps_max: null, seconds: cardio ? 45 : 30, rest_seconds: 45 };
  }
  switch (goal) {
    case "get_stronger":
      return { dose_type: "reps", sets: 4, reps_min: 5, reps_max: 6, seconds: null, rest_seconds: 150 };
    case "build_muscle":
      return { dose_type: "reps", sets: 3, reps_min: 8, reps_max: 12, seconds: null, rest_seconds: 90 };
    case "lose_weight":
    case "endurance":
      return { dose_type: "reps", sets: 3, reps_min: 12, reps_max: 15, seconds: null, rest_seconds: 60 };
    case "stay_healthy":
      return { dose_type: "reps", sets: 3, reps_min: 10, reps_max: 12, seconds: null, rest_seconds: 75 };
  }
}

/**
 * Deterministic, rule-based exercise selection for one session (locked v1
 * scope: no AI). Filters the library by the user's equipment tier and hard
 * limitation conflicts, scores by overlap with the day's focus muscles,
 * then books a warm-up, 4 main movements (varied by first muscle group),
 * and a cool-down.
 */
export function selectSessionExercises(
  focusMuscles: string[],
  goal: Goal,
  equipment: Equipment,
  limitations: string[],
  library: ExerciseRow[],
): SessionExerciseInsert[] {
  const usable = library.filter(
    (ex) => EQUIPMENT_TIER[ex.equipment] <= EQUIPMENT_TIER[equipment] && !conflictsHard(ex, limitations),
  );
  const bySlug = new Map(usable.map((ex) => [ex.slug, ex]));

  const out: SessionExerciseInsert[] = [];
  let order = 0;
  const push = (ex: ExerciseRow, flags: Partial<SessionExerciseInsert> = {}) => {
    const dose = doseFor(ex, goal);
    out.push({
      exercise_id: ex.id,
      order_index: order++,
      is_warmup: false,
      is_cooldown: false,
      is_optional: false,
      ...dose,
      ...flags,
    });
  };

  const warmup = WARMUP_SLUGS.map((s) => bySlug.get(s)).find(Boolean);
  if (warmup) {
    push(warmup, { is_warmup: true, sets: 1, dose_type: "time", seconds: 60, reps_min: null, reps_max: null, rest_seconds: 0 });
  }

  const mains = usable
    .filter((ex) => !ex.muscle_groups.includes("Mobility"))
    .map((ex) => ({ ex, score: ex.muscle_groups.filter((m) => focusMuscles.includes(m)).length }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || b.ex.difficulty - a.ex.difficulty);

  const seenPrimary = new Set<string>();
  let added = 0;
  for (const { ex } of mains) {
    if (added >= 4) break;
    const primary = ex.muscle_groups[0];
    // First pass prefers variety across primary muscles; duplicates get a
    // second chance below if the session is still short.
    if (seenPrimary.has(primary) && added < 3) continue;
    seenPrimary.add(primary);
    push(ex);
    added++;
  }
  if (added < 4) {
    for (const { ex } of mains) {
      if (added >= 4) break;
      if (out.some((o) => o.exercise_id === ex.id)) continue;
      push(ex);
      added++;
    }
  }

  const cooldown = COOLDOWN_SLUGS.map((s) => bySlug.get(s)).find(
    (ex) => ex && !out.some((o) => o.exercise_id === ex.id),
  );
  if (cooldown) {
    push(cooldown, { is_cooldown: true, sets: 1, dose_type: "time", seconds: 60, reps_min: null, reps_max: null, rest_seconds: 0 });
  }

  return out;
}

/** Rough session-length estimate in minutes, same math everywhere. */
export function estimateMinutes(
  rows: { dose_type: string; sets: number | null; reps_max: number | null; seconds: number | null; rest_seconds: number | null }[],
): number {
  let secs = 0;
  for (const r of rows) {
    const sets = r.sets ?? 1;
    const work = r.dose_type === "time" ? (r.seconds ?? 30) : (r.reps_max ?? 10) * 3;
    secs += sets * work + (r.rest_seconds ?? 60) * Math.max(0, sets - 1) + 40; // 40s transition
  }
  return Math.max(5, Math.round(secs / 60));
}
