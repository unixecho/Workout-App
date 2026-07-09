"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
