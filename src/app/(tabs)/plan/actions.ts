"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { generateWeek, type Equipment, type Goal } from "@/lib/plan/generate";
import { selectSessionExercises, type ExerciseRow } from "@/lib/plan/exercises";
import { mondayIndex } from "@/lib/data";

/** Monday 00:00 (local) for the week containing `d`. */
function startOfWeek(d: Date): Date {
  const start = new Date(d);
  start.setDate(start.getDate() - mondayIndex(d));
  start.setHours(0, 0, 0, 0);
  return start;
}

/**
 * Regenerate the active plan (FD §4). `plan_days` is a single recurring
 * weekly template — the same 7 rows are projected onto every week (and onto
 * every month in the Plan tab's Month view), not one row per calendar date.
 *
 * `full = false` (the Plan tab's manual "Regenerate week" button): only days
 * from today onward are touched, so a reshuffle mid-week doesn't disturb
 * days already behind you.
 *
 * `full = true` (an availability change): every day-of-week slot is
 * regenerated so the whole template — and therefore Week *and* Month view —
 * matches the new availability immediately, not just the remainder of this
 * week. A day already logged complete *this* week is still protected.
 */
export async function regenerateWeek(full = false) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("goal, equipment, limitations, weekday_availability")
    .eq("user_id", user.id)
    .single();
  if (!profile?.goal) throw new Error("No profile");

  const { data: plan } = await supabase
    .from("plans")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("generated_at", { ascending: false })
    .limit(1)
    .single();
  if (!plan) throw new Error("No active plan");

  const { data: days } = await supabase
    .from("plan_days")
    .select("id, day_of_week")
    .eq("plan_id", plan.id);
  if (!days) throw new Error("No plan days");

  // Scoped to THIS week only — plan_day_id is a recurring weekly slot, not a
  // specific date, so an all-time check would permanently freeze any slot
  // ever completed in a past week and never let it regenerate again.
  const { data: doneLogs } = await supabase
    .from("workout_logs")
    .select("plan_day_id")
    .eq("user_id", user.id)
    .eq("status", "complete")
    .gte("completed_at", startOfWeek(new Date()).toISOString());
  const completedDayIds = new Set((doneLogs ?? []).map((l) => l.plan_day_id));

  const todayIdx = mondayIndex(new Date());
  const activeDays = Array.from({ length: 7 }, (_, i) =>
    (profile.weekday_availability ?? []).includes(i),
  );
  const fresh = generateWeek(profile.goal as Goal, activeDays);

  const { data: library } = await supabase
    .from("exercises")
    .select("id, slug, name, muscle_groups, equipment, difficulty, adaptations");

  for (const day of days) {
    if (!full && day.day_of_week < todayIdx) continue;
    if (completedDayIds.has(day.id)) continue;
    const gen = fresh[day.day_of_week];

    await supabase
      .from("plan_days")
      .update({
        is_rest_day: gen.isRestDay,
        session_title: gen.sessionTitle,
        focus_muscles: gen.focusMuscles,
        est_duration_min: gen.estDurationMin,
      })
      .eq("id", day.id);
    await supabase.from("session_exercises").delete().eq("plan_day_id", day.id);

    if (!gen.isRestDay && library?.length) {
      const rows = selectSessionExercises(
        gen.focusMuscles,
        profile.goal as Goal,
        profile.equipment as Equipment,
        profile.limitations ?? [],
        library as ExerciseRow[],
      ).map((se) => ({ ...se, plan_day_id: day.id }));
      if (rows.length) await supabase.from("session_exercises").insert(rows);
    }
  }

  revalidatePath("/plan");
  revalidatePath("/today");
}

/** Convert one day to a rest day (FD §4 ⋯ menu). */
export async function convertToRestDay(planDayId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  await supabase
    .from("plan_days")
    .update({ is_rest_day: true, session_title: null, focus_muscles: [], est_duration_min: null })
    .eq("id", planDayId);
  await supabase.from("session_exercises").delete().eq("plan_day_id", planDayId);

  revalidatePath("/plan");
  revalidatePath("/today");
}
