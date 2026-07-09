/**
 * One-off maintenance: fill session_exercises for plans created before the
 * generator selected exercises. Uses the exact same selection logic as
 * onboarding. Run: npx tsx scripts/backfill-session-exercises.ts
 * Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in env.
 */
import { selectSessionExercises, type ExerciseRow } from "../src/lib/plan/exercises";
import type { Equipment, Goal } from "../src/lib/plan/generate";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };

async function get<T>(path: string): Promise<T> {
  const r = await fetch(`${URL}/rest/v1/${path}`, { headers: H });
  if (!r.ok) throw new Error(`${path}: ${r.status} ${await r.text()}`);
  return r.json();
}

async function main() {
  const plans = await get<{ id: string; user_id: string }[]>("plans?status=eq.active&select=id,user_id");
  const library = await get<ExerciseRow[]>("exercises?select=id,slug,name,muscle_groups,equipment,difficulty,adaptations");

  for (const plan of plans) {
    const [profile] = await get<{ goal: Goal; equipment: Equipment; limitations: string[] }[]>(
      `profiles?user_id=eq.${plan.user_id}&select=goal,equipment,limitations`,
    );
    const days = await get<{ id: string; is_rest_day: boolean; focus_muscles: string[] }[]>(
      `plan_days?plan_id=eq.${plan.id}&select=id,is_rest_day,focus_muscles`,
    );
    for (const day of days.filter((d) => !d.is_rest_day)) {
      const existing = await get<{ id: string }[]>(`session_exercises?plan_day_id=eq.${day.id}&select=id&limit=1`);
      if (existing.length) continue; // already filled
      const rows = selectSessionExercises(
        day.focus_muscles ?? [],
        profile.goal ?? "stay_healthy",
        profile.equipment ?? "none",
        profile.limitations ?? [],
        library,
      ).map((se) => ({ ...se, plan_day_id: day.id }));
      const r = await fetch(`${URL}/rest/v1/session_exercises`, { method: "POST", headers: H, body: JSON.stringify(rows) });
      if (!r.ok) throw new Error(`insert day ${day.id}: ${r.status} ${await r.text()}`);
      console.log(`filled day ${day.id} with ${rows.length} exercises`);
    }
  }
  console.log("done");
}

main();
