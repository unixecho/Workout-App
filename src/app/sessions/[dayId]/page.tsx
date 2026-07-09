import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/data";
import { SessionEditorScreen, type EditorExercise } from "@/components/sessions/SessionEditorScreen";

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default async function SessionEditorPage({ params }: { params: Promise<{ dayId: string }> }) {
  const { dayId } = await params;
  const { supabase, profile } = await requireProfile();

  const { data: day } = await supabase
    .from("plan_days")
    .select("id, day_of_week, is_rest_day, session_title, est_duration_min")
    .eq("id", dayId)
    .single();
  if (!day) notFound();

  const { data: rows } = await supabase
    .from("session_exercises")
    .select("id, order_index, is_warmup, is_cooldown, is_optional, dose_type, sets, reps_min, reps_max, seconds, rest_seconds, exercises(slug, name, muscle_groups, adaptations)")
    .eq("plan_day_id", dayId)
    .order("order_index");

  const exercises: EditorExercise[] = (rows ?? []).map((r) => {
    const ex = r.exercises as unknown as { slug: string; name: string; muscle_groups: string[]; adaptations: Record<string, { note: string; avoid: boolean }> };
    const warn = (profile.limitations ?? []).some((t: string) => ex.adaptations?.[t.toLowerCase()]);
    return {
      id: r.id,
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

  return (
    <SessionEditorScreen
      dayId={day.id}
      dayName={DAY_NAMES[day.day_of_week]}
      title={day.session_title ?? "Session"}
      usualMinutes={45}
      initialExercises={exercises}
    />
  );
}
