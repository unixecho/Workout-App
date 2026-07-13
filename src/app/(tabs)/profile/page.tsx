import { requireProfile } from "@/lib/data";
import { getLocale } from "@/lib/i18n/server";
import { formatDate } from "@/lib/i18n/format";
import { ProfileScreen } from "@/components/profile/ProfileScreen";

export default async function ProfilePage() {
  const { supabase, user, profile } = await requireProfile();
  const locale = await getLocale();

  const [{ data: streak }, { count: workouts }, { count: badges }, { data: prefs }] = await Promise.all([
    supabase.from("streaks").select("current_streak").eq("user_id", user.id).single(),
    supabase
      .from("workout_logs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "complete"),
    supabase
      .from("user_badges")
      .select("badge_id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .not("earned_at", "is", null),
    supabase
      .from("notification_prefs")
      .select("workout_reminder_enabled, friend_activity_enabled, badge_earned_enabled")
      .eq("user_id", user.id)
      .single(),
  ]);

  return (
    <ProfileScreen
      displayName={profile.display_name ?? ""}
      handle={profile.handle ?? ""}
      email={user.email ?? ""}
      joined={formatDate(locale, profile.created_at, { month: "long", year: "numeric" })}
      stats={{ streak: streak?.current_streak ?? 0, badges: badges ?? 0, workouts: workouts ?? 0 }}
      body={{
        age: profile.age,
        heightCm: profile.height_cm ? Number(profile.height_cm) : null,
        weightKg: profile.weight_kg ? Number(profile.weight_kg) : null,
      }}
      unitPref={profile.unit_pref as "metric" | "imperial"}
      goal={profile.goal ?? "stay_healthy"}
      weekdayAvailability={profile.weekday_availability ?? []}
      equipment={profile.equipment ?? "none"}
      limitations={profile.limitations ?? []}
      notif={{
        reminder: prefs?.workout_reminder_enabled ?? true,
        friendActivity: prefs?.friend_activity_enabled ?? true,
        badgeEarned: prefs?.badge_earned_enabled ?? true,
      }}
      visibility={profile.activity_visibility as "friends" | "private"}
    />
  );
}
