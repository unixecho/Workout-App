import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/data";
import { adaptationNote, type ExerciseRow } from "@/lib/plan/exercises";
import { WorkoutPlayer, type PlayerExercise } from "@/components/workout/WorkoutPlayer";

export default async function WorkoutPage({ params }: { params: Promise<{ dayId: string }> }) {
  const { dayId } = await params;
  const { supabase, user, profile } = await requireProfile();

  const { data: day } = await supabase
    .from("plan_days")
    .select("id, session_title, focus_muscles, est_duration_min, plans(name)")
    .eq("id", dayId)
    .single();
  if (!day) notFound();

  const { data: rows } = await supabase
    .from("session_exercises")
    .select("id, order_index, is_warmup, is_cooldown, is_optional, dose_type, sets, reps_min, reps_max, seconds, rest_seconds, exercises(id, slug, name, muscle_groups, equipment, difficulty, demo_keyframes, form_cues, common_mistakes, adaptations)")
    .eq("plan_day_id", dayId)
    .order("order_index");

  // Resume state: which exercises are already logged in an open session
  const { data: openLog } = await supabase
    .from("workout_logs")
    .select("id")
    .eq("user_id", user.id)
    .eq("plan_day_id", dayId)
    .eq("status", "in_progress")
    .limit(1)
    .maybeSingle();
  let loggedIds: string[] = [];
  if (openLog) {
    const { data: logs } = await supabase
      .from("exercise_logs")
      .select("exercise_id")
      .eq("workout_log_id", openLog.id)
      .eq("removed", false);
    loggedIds = (logs ?? []).map((l) => l.exercise_id as string);
  }

  const exercises: PlayerExercise[] = (rows ?? []).map((r) => {
    const ex = r.exercises as unknown as ExerciseRow & {
      demo_keyframes: { pattern?: string };
      form_cues: string | null;
      common_mistakes: string[];
    };
    return {
      id: r.id,
      exerciseId: ex.id,
      name: ex.name,
      pattern: ex.demo_keyframes?.pattern ?? "squat",
      formCue: ex.form_cues,
      watchFor: ex.common_mistakes?.[0] ?? null,
      adaptation: adaptationNote(ex, profile.limitations ?? []),
      isWarmup: r.is_warmup,
      isCooldown: r.is_cooldown,
      isOptional: r.is_optional,
      doseType: r.dose_type as "reps" | "time",
      sets: r.sets ?? 1,
      repsMin: r.reps_min,
      repsMax: r.reps_max,
      seconds: r.seconds,
      done: loggedIds.includes(ex.id),
    };
  });

  const plan = day.plans as unknown as { name: string } | null;

  return (
    <WorkoutPlayer
      dayId={day.id}
      planName={plan?.name ?? "RepUp"}
      title={day.session_title ?? "Workout"}
      subtitle={`${(day.focus_muscles ?? []).join(" & ")} · ~${day.est_duration_min ?? 45} min`}
      exercises={exercises}
      existingLogId={openLog?.id ?? null}
    />
  );
}
