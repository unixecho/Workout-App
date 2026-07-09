"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/** Picker mode: append an exercise to a session, then return to the editor. */
export async function addToSession(planDayId: string, exerciseId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const { data: last } = await supabase
    .from("session_exercises")
    .select("order_index")
    .eq("plan_day_id", planDayId)
    .order("order_index", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: ex } = await supabase
    .from("exercises")
    .select("slug")
    .eq("id", exerciseId)
    .single();
  const timed = ["plank", "bird-dog", "superman-hold", "dead-bug", "jumping-jacks", "mountain-climbers", "treadmill-intervals", "light-march", "arm-circles", "cat-cow", "hip-circles", "childs-pose"].includes(ex?.slug ?? "");

  await supabase.from("session_exercises").insert({
    plan_day_id: planDayId,
    exercise_id: exerciseId,
    order_index: (last?.order_index ?? 0) + 1,
    dose_type: timed ? "time" : "reps",
    sets: 3,
    reps_min: timed ? null : 8,
    reps_max: timed ? null : 12,
    seconds: timed ? 30 : null,
    rest_seconds: 75,
  });

  revalidatePath(`/sessions/${planDayId}`);
  redirect(`/sessions/${planDayId}`);
}
