"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** Find or create the in_progress log for this plan day. */
export async function ensureWorkoutLog(planDayId: string): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const { data: existing } = await supabase
    .from("workout_logs")
    .select("id")
    .eq("user_id", user.id)
    .eq("plan_day_id", planDayId)
    .eq("status", "in_progress")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from("workout_logs")
    .insert({ user_id: user.id, plan_day_id: planDayId, status: "in_progress" })
    .select("id")
    .single();
  if (error || !created) throw new Error(error?.message ?? "Failed to start workout");
  return created.id;
}

/** Toggle one exercise's completion inside a workout. */
export async function setExerciseLogged(
  workoutLogId: string,
  exerciseId: string,
  logged: boolean,
  setsCompleted: Array<{ reps?: number; seconds?: number; weight?: number } | number>,
) {
  const supabase = await createClient();
  if (logged) {
    // Idempotent: never leave duplicate rows for the same exercise
    await supabase
      .from("exercise_logs")
      .delete()
      .eq("workout_log_id", workoutLogId)
      .eq("exercise_id", exerciseId);
    await supabase.from("exercise_logs").insert({
      workout_log_id: workoutLogId,
      exercise_id: exerciseId,
      sets_completed: setsCompleted,
    });
  } else {
    await supabase
      .from("exercise_logs")
      .delete()
      .eq("workout_log_id", workoutLogId)
      .eq("exercise_id", exerciseId);
  }
}

interface BadgeRule {
  type: string;
  threshold?: number | string;
  exercise?: string;
}

/**
 * Finish the workout: close the log, update the streak, evaluate badge
 * rules (docs/TD.md — one rule dispatcher, not per-badge code), publish
 * the feed event, and return newly earned badges for the celebration.
 * Client supplies its local date/hour so the day boundary follows the
 * device timezone (FD §12.1).
 */
export async function completeWorkout(
  workoutLogId: string,
  localDate: string, // YYYY-MM-DD on the user's device
  localStartHour: number,
  totalReps: number,
): Promise<{ newBadges: { name: string; description: string }[] }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const { data: log } = await supabase
    .from("workout_logs")
    .select("id, started_at, plan_day_id")
    .eq("id", workoutLogId)
    .single();
  if (!log) throw new Error("No log");

  const durationSeconds = Math.max(
    60,
    Math.round((Date.now() - new Date(log.started_at).getTime()) / 1000),
  );
  await supabase
    .from("workout_logs")
    .update({
      status: "complete",
      completed_at: new Date().toISOString(),
      duration_seconds: durationSeconds,
      total_reps: totalReps,
    })
    .eq("id", workoutLogId);

  // ---- Streak (simple v1 of FD §12.1: extend if consecutive credited day) --
  const { data: streak } = await supabase
    .from("streaks")
    .select("current_streak, longest_streak, freeze_count, last_credited_date")
    .eq("user_id", user.id)
    .single();

  let current = streak?.current_streak ?? 0;
  const last = streak?.last_credited_date as string | null;
  if (last !== localDate) {
    const yesterday = new Date(localDate + "T12:00:00");
    yesterday.setDate(yesterday.getDate() - 1);
    const yestStr = yesterday.toISOString().slice(0, 10);
    current = last === yestStr ? current + 1 : 1;
    await supabase
      .from("streaks")
      .update({
        current_streak: current,
        longest_streak: Math.max(current, streak?.longest_streak ?? 0),
        last_credited_date: localDate,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);
  }

  // ---- Aggregates for badge rules ----------------------------------------
  const { count: totalSessions } = await supabase
    .from("workout_logs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "complete");
  const { data: sums } = await supabase
    .from("workout_logs")
    .select("total_reps, duration_seconds")
    .eq("user_id", user.id)
    .eq("status", "complete");
  const cumReps = (sums ?? []).reduce((a, r) => a + (r.total_reps ?? 0), 0);
  const cumMinutes = Math.round((sums ?? []).reduce((a, r) => a + (r.duration_seconds ?? 0), 0) / 60);

  // Weight-based aggregates for today's session
  const { data: todayLogs } = await supabase
    .from("exercise_logs")
    .select("sets_completed, exercises(slug)")
    .eq("workout_log_id", workoutLogId);
  let maxLoadingToday = 0;
  let totalLoadingToday = 0;
  const maxLoadByExercise: Record<string, number> = {};
  for (const log of todayLogs ?? []) {
    const sets = log.sets_completed as Array<{ reps?: number; seconds?: number; weight?: number } | number>;
    const exerciseSlug = (log.exercises as { slug: string } | null)?.slug ?? "";
    for (const set of sets) {
      const weight = typeof set === "number" ? 0 : (set.weight ?? 0);
      const reps = typeof set === "number" ? set : (set.reps ?? 1);
      maxLoadingToday = Math.max(maxLoadingToday, weight);
      totalLoadingToday += weight * reps;
      if (weight > 0) {
        maxLoadByExercise[exerciseSlug] = Math.max(maxLoadByExercise[exerciseSlug] ?? 0, weight);
      }
    }
  }

  const { data: catalog } = await supabase.from("badges").select("id, key, name, description, unlock_rule");
  const { data: mine } = await supabase
    .from("user_badges")
    .select("badge_id, earned_at")
    .eq("user_id", user.id);
  const earned = new Set((mine ?? []).filter((b) => b.earned_at).map((b) => b.badge_id));

  const met = (rule: BadgeRule): boolean => {
    const t = rule.threshold;
    switch (rule.type) {
      case "total_sessions_gte":
        return (totalSessions ?? 0) >= Number(t);
      case "streak_length_gte":
        return current >= Number(t);
      case "cumulative_reps_gte":
        return cumReps >= Number(t);
      case "cumulative_minutes_gte":
        return cumMinutes >= Number(t);
      case "session_time_before":
        return localStartHour < parseInt(String(t), 10);
      case "session_time_after":
        return localStartHour >= parseInt(String(t), 10);
      case "milestone_loading":
        // Check if any exercise (or a specific one) reached weight threshold
        if (rule.exercise && rule.exercise !== "any") {
          return (maxLoadByExercise[rule.exercise] ?? 0) >= Number(t);
        }
        // If no specific exercise or exercise is "any", check any single lift
        return maxLoadingToday >= Number(t);
      case "total_daily_loading":
        return totalLoadingToday >= Number(t);
      default:
        return false; // full_week / comeback / goal / social / perfect_form: later pass
    }
  };

  const newBadges: { id: string; name: string; description: string }[] = [];
  for (const b of catalog ?? []) {
    if (earned.has(b.id)) continue;
    if (met(b.unlock_rule as BadgeRule)) newBadges.push({ id: b.id, name: b.name, description: b.description });
  }
  if (newBadges.length) {
    await supabase.from("user_badges").upsert(
      newBadges.map((b) => ({ user_id: user.id, badge_id: b.id, earned_at: new Date().toISOString() })),
      { onConflict: "user_id,badge_id" },
    );
  }

  // ---- Feed events (trusted server-side insert, fan-out via trigger) ------
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, handle, activity_visibility")
    .eq("user_id", user.id)
    .single();
  const { data: day } = log.plan_day_id
    ? await supabase.from("plan_days").select("session_title").eq("id", log.plan_day_id).single()
    : { data: null };

  const admin = createAdminClient();
  const visible = profile?.activity_visibility !== "private";
  const actor = { actor_name: profile?.display_name ?? "Someone", actor_handle: profile?.handle ?? "" };
  await admin.from("activity_events").insert([
    {
      user_id: user.id,
      type: "session_completed",
      visible_to_friends: visible,
      payload: { ...actor, session_title: day?.session_title ?? "a workout", streak: current },
    },
    ...newBadges.map((b) => ({
      user_id: user.id,
      type: "badge_earned" as const,
      visible_to_friends: visible,
      payload: { ...actor, badge_name: b.name },
    })),
  ]);

  revalidatePath("/today");
  revalidatePath("/stats");
  return { newBadges: newBadges.map(({ name, description }) => ({ name, description })) };
}
