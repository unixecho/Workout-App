"use server";

import { createClient } from "@/lib/supabase/server";
import { generateWeek, type Equipment, type Goal } from "@/lib/plan/generate";
import { redirect } from "next/navigation";

export interface CompleteOnboardingInput {
  handle: string;
  displayName: string;
  age: number | null;
  heightCm: number | null;
  weightKg: number | null;
  unitPref: "metric" | "imperial";
  goal: Goal;
  targetWeightKg: number | null;
  activeDays: boolean[]; // index 0 = Monday
  equipment: Equipment;
  limitations: string[];
}

/**
 * Writes onboarding's collected data as the real `profiles` row, generates
 * the first week (docs/TD.md — API structure: `generatePlan`), and persists
 * it as `plans`/`plan_days`. Per-session exercise detail (`session_exercises`)
 * is intentionally left empty until the exercise library is seeded.
 */
export async function completeOnboarding(input: CompleteOnboardingInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/onboarding");
  }

  const daysPerWeek = input.activeDays.filter(Boolean).length;

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      handle: input.handle.toLowerCase(),
      display_name: input.displayName,
      age: input.age,
      height_cm: input.heightCm,
      weight_kg: input.weightKg,
      unit_pref: input.unitPref,
      goal: input.goal,
      target_weight_kg: input.targetWeightKg,
      days_per_week: daysPerWeek,
      weekday_availability: input.activeDays
        .map((on, i) => (on ? i : null))
        .filter((i): i is number => i !== null),
      equipment: input.equipment,
      limitations: input.limitations,
    })
    .eq("user_id", user.id);

  if (profileError) {
    throw new Error(`Failed to save profile: ${profileError.message}`);
  }

  const week = generateWeek(input.goal, input.activeDays);
  const weekStart = startOfWeekMonday(new Date());

  const { data: plan, error: planError } = await supabase
    .from("plans")
    .insert({
      user_id: user.id,
      name: goalToPlanName(input.goal),
      week_start_date: weekStart.toISOString().slice(0, 10),
      status: "active",
    })
    .select("id")
    .single();

  if (planError || !plan) {
    throw new Error(`Failed to create plan: ${planError?.message}`);
  }

  const { error: daysError } = await supabase.from("plan_days").insert(
    week.map((day) => ({
      plan_id: plan.id,
      day_of_week: day.dayOfWeek,
      is_rest_day: day.isRestDay,
      session_title: day.sessionTitle,
      focus_muscles: day.focusMuscles,
      est_duration_min: day.estDurationMin,
    })),
  );

  if (daysError) {
    throw new Error(`Failed to create plan days: ${daysError.message}`);
  }

  redirect("/today");
}

function goalToPlanName(goal: Goal): string {
  switch (goal) {
    case "lose_weight":
      return "Lose Weight Plan";
    case "build_muscle":
      return "Build Muscle Plan";
    case "get_stronger":
      return "Get Stronger Plan";
    case "endurance":
      return "Endurance Plan";
    case "stay_healthy":
      return "Stay Healthy Plan";
  }
}

function startOfWeekMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun..6=Sat
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
