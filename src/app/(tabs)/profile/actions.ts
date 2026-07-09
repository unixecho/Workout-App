"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function updateBodyStats(age: number | null, heightCm: number | null, weightKg: number | null) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  await supabase
    .from("profiles")
    .update({ age, height_cm: heightCm, weight_kg: weightKg })
    .eq("user_id", user.id);
  revalidatePath("/profile");
  revalidatePath("/stats");
}

/**
 * Training-affecting settings (FD §10): goal, availability, equipment,
 * limitations. The UI offers "Regenerate remaining days?" after saving —
 * regeneration itself is the Plan tab's regenerateWeek action.
 */
export async function updateTraining(fields: {
  goal?: string;
  weekdayAvailability?: number[];
  equipment?: string;
  limitations?: string[];
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const update: Record<string, unknown> = {};
  if (fields.goal !== undefined) update.goal = fields.goal;
  if (fields.equipment !== undefined) update.equipment = fields.equipment;
  if (fields.limitations !== undefined) update.limitations = fields.limitations;
  if (fields.weekdayAvailability !== undefined) {
    update.weekday_availability = fields.weekdayAvailability;
    update.days_per_week = fields.weekdayAvailability.length;
  }
  await supabase.from("profiles").update(update).eq("user_id", user.id);
  revalidatePath("/profile");
}

export async function updateUnits(pref: "metric" | "imperial") {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  await supabase.from("profiles").update({ unit_pref: pref }).eq("user_id", user.id);
  revalidatePath("/profile");
}

export async function updateNotificationPref(
  key: "friend_activity_enabled" | "badge_earned_enabled" | "workout_reminder_enabled" | "streak_risk_enabled",
  value: boolean,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  await supabase.from("notification_prefs").update({ [key]: value }).eq("user_id", user.id);
  revalidatePath("/profile");
}

export async function updateVisibility(visibility: "friends" | "private") {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  await supabase.from("profiles").update({ activity_visibility: visibility }).eq("user_id", user.id);
  revalidatePath("/profile");
}

/**
 * Irreversible account deletion (FD §10: double confirmation happens in the
 * UI — sheet + type-your-handle gate — before this is callable). Deleting
 * the auth user cascades through profiles and every owned table via FKs.
 */
export async function deleteAccount(confirmHandle: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("handle")
    .eq("user_id", user.id)
    .single();
  if (!profile?.handle || profile.handle !== confirmHandle.toLowerCase().trim()) {
    throw new Error("Handle doesn't match");
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) throw new Error(error.message);

  redirect("/onboarding");
}
