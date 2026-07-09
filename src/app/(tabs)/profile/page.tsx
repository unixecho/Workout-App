import { requireProfile } from "@/lib/data";
import { ProfileScreen } from "@/components/profile/ProfileScreen";

const GOAL_LABELS: Record<string, string> = {
  lose_weight: "Lose weight",
  build_muscle: "Build muscle",
  get_stronger: "Get stronger",
  endurance: "Endurance",
  stay_healthy: "Stay healthy",
};

export default async function ProfilePage() {
  const { supabase, user, profile } = await requireProfile();

  const { data: streak } = await supabase
    .from("streaks")
    .select("current_streak")
    .eq("user_id", user.id)
    .single();
  const { count: workouts } = await supabase
    .from("workout_logs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "complete");
  const { count: badges } = await supabase
    .from("user_badges")
    .select("badge_id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .not("earned_at", "is", null);
  const { data: prefs } = await supabase
    .from("notification_prefs")
    .select("workout_reminder_enabled, workout_reminder_time, friend_activity_enabled, badge_earned_enabled")
    .eq("user_id", user.id)
    .single();

  return (
    <ProfileScreen
      displayName={profile.display_name ?? ""}
      handle={profile.handle ?? ""}
      email={user.email ?? ""}
      joined={new Date(profile.created_at).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
      stats={{ streak: streak?.current_streak ?? 0, badges: badges ?? 0, workouts: workouts ?? 0 }}
      body={{
        age: profile.age,
        heightCm: profile.height_cm ? Number(profile.height_cm) : null,
        weightKg: profile.weight_kg ? Number(profile.weight_kg) : null,
        units: profile.unit_pref === "imperial" ? "lb · ft-in" : "kg · cm",
        goal: GOAL_LABELS[profile.goal ?? ""] ?? "—",
      }}
      training={{
        daysPerWeek: profile.days_per_week ?? 0,
        equipment: profile.equipment === "full_gym" ? "Full gym" : profile.equipment === "basic" ? "Basic" : "None",
        limitations: (profile.limitations ?? []).join(", ") || "None",
      }}
      notif={{
        reminder: prefs?.workout_reminder_enabled ?? true,
        friendActivity: prefs?.friend_activity_enabled ?? true,
        badgeEarned: prefs?.badge_earned_enabled ?? true,
      }}
      visibility={profile.activity_visibility as "friends" | "private"}
    />
  );
}
