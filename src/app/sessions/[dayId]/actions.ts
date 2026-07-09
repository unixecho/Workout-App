"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { estimateMinutes } from "@/lib/plan/exercises";

export interface DoseUpdate {
  id: string;
  sets: number;
  reps_min: number | null;
  reps_max: number | null;
  seconds: number | null;
  rest_seconds: number;
}

export async function saveSession(
  planDayId: string,
  title: string,
  updates: DoseUpdate[],
  removedIds: string[],
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  if (removedIds.length) {
    await supabase.from("session_exercises").delete().in("id", removedIds);
  }
  for (const u of updates) {
    await supabase
      .from("session_exercises")
      .update({ sets: u.sets, reps_min: u.reps_min, reps_max: u.reps_max, seconds: u.seconds, rest_seconds: u.rest_seconds })
      .eq("id", u.id);
  }

  const { data: rows } = await supabase
    .from("session_exercises")
    .select("dose_type, sets, reps_max, seconds, rest_seconds")
    .eq("plan_day_id", planDayId);

  await supabase
    .from("plan_days")
    .update({ session_title: title, est_duration_min: estimateMinutes(rows ?? []) })
    .eq("id", planDayId);

  revalidatePath("/plan");
  revalidatePath("/today");
  revalidatePath(`/sessions/${planDayId}`);
}
