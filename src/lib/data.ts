import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/** Monday-based weekday index (0=Mon..6=Sun) for a local date. */
export function mondayIndex(d: Date): number {
  return (d.getDay() + 6) % 7;
}

export interface PlanDay {
  id: string;
  day_of_week: number;
  is_rest_day: boolean;
  session_title: string | null;
  focus_muscles: string[];
  est_duration_min: number | null;
}

/**
 * Auth + profile gate shared by every app screen: no session or unfinished
 * onboarding → back to /onboarding. Returns the Supabase client too so
 * pages don't create a second one.
 */
export async function requireProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/onboarding");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();
  if (!profile?.handle) redirect("/onboarding");

  return { supabase, user, profile };
}

export async function getActivePlan(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data: plan } = await supabase
    .from("plans")
    .select("id, name, week_start_date, generated_at")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("generated_at", { ascending: false })
    .limit(1)
    .single();
  if (!plan) return null;

  const { data: days } = await supabase
    .from("plan_days")
    .select("id, day_of_week, is_rest_day, session_title, focus_muscles, est_duration_min")
    .eq("plan_id", plan.id)
    .order("day_of_week");

  return { ...plan, days: (days ?? []) as PlanDay[] };
}
