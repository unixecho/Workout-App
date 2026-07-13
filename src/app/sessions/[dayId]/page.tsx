import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/data";
import { getI18n } from "@/lib/i18n/server";
import { equipmentAllows } from "@/lib/plan/exercises";
import type { Equipment } from "@/lib/plan/generate";
import { SessionEditorScreen, type EditorExercise, type SwapOption } from "@/components/sessions/SessionEditorScreen";


export default async function SessionEditorPage({ params }: { params: Promise<{ dayId: string }> }) {
  const { dayId } = await params;
  const { supabase, profile } = await requireProfile();
  const { t } = await getI18n();

  const { data: day } = await supabase
    .from("plan_days")
    .select("id, day_of_week, is_rest_day, session_title, est_duration_min")
    .eq("id", dayId)
    .single();
  if (!day) notFound();

  const [{ data: rows }, { data: warmupLib }] = await Promise.all([
    supabase
      .from("session_exercises")
      .select("id, order_index, is_warmup, is_cooldown, is_optional, dose_type, sets, reps_min, reps_max, seconds, rest_seconds, exercises(id, slug, name, muscle_groups, adaptations)")
      .eq("plan_day_id", dayId)
      .order("order_index"),
    supabase
      .from("exercises")
      .select("id, name, muscle_groups, equipment")
      .contains("muscle_groups", ["Warmup"]),
  ]);

  const exercises: EditorExercise[] = (rows ?? []).map((r) => {
    const ex = r.exercises as unknown as { id: string; slug: string; name: string; muscle_groups: string[]; adaptations: Record<string, { note: string; avoid: boolean }> };
    const warn = (profile.limitations ?? []).some((t: string) => ex.adaptations?.[t.toLowerCase()]);
    return {
      id: r.id,
      exerciseId: ex.id,
      name: ex.name,
      muscles: ex.muscle_groups,
      isWarmup: r.is_warmup,
      isCooldown: r.is_cooldown,
      doseType: r.dose_type as "reps" | "time",
      sets: r.sets ?? 1,
      repsMin: r.reps_min,
      repsMax: r.reps_max,
      seconds: r.seconds,
      restSeconds: r.rest_seconds ?? 60,
      warns: warn,
    };
  });

  // Warm-up alternatives the user can swap in — only ones their equipment
  // supports (docs/TD.md capability sets).
  const warmupOptions: SwapOption[] = (warmupLib ?? [])
    .filter((w) => equipmentAllows((profile.equipment ?? "none") as Equipment, w.equipment as Equipment))
    .map((w) => ({ exerciseId: w.id, name: w.name, muscles: w.muscle_groups }));

  return (
    <SessionEditorScreen
      dayId={day.id}
      dayName={t.plan.dayLong[day.day_of_week]}
      title={day.session_title ?? t.stats.workoutFallback}
      usualMinutes={45}
      initialExercises={exercises}
      warmupOptions={warmupOptions}
    />
  );
}
