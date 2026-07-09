import { requireProfile } from "@/lib/data";
import { BadgesScreen, type BadgeTile } from "@/components/badges/BadgesScreen";

export default async function BadgesPage() {
  const { supabase, user } = await requireProfile();

  const [{ data: catalog }, { data: mine }, { data: sums }, { data: streak }, { count: friends }, { count: bumps }] =
    await Promise.all([
      supabase.from("badges").select("id, key, section, name, description, unlock_rule").order("section"),
      supabase.from("user_badges").select("badge_id, earned_at").eq("user_id", user.id),
      supabase
        .from("workout_logs")
        .select("total_reps, duration_seconds")
        .eq("user_id", user.id)
        .eq("status", "complete"),
      supabase.from("streaks").select("current_streak").eq("user_id", user.id).single(),
      supabase
        .from("friendships")
        .select("user_a", { count: "exact", head: true })
        .or(`user_a.eq.${user.id},user_b.eq.${user.id}`),
      supabase
        .from("fist_bumps")
        .select("event_id", { count: "exact", head: true })
        .eq("from_user_id", user.id),
    ]);
  const earnedAt = new Map((mine ?? []).filter((b) => b.earned_at).map((b) => [b.badge_id, b.earned_at as string]));
  const sessions = (sums ?? []).length;
  const reps = (sums ?? []).reduce((a, r) => a + (r.total_reps ?? 0), 0);
  const minutes = Math.round((sums ?? []).reduce((a, r) => a + (r.duration_seconds ?? 0), 0) / 60);

  const progressFor = (rule: { type: string; threshold?: number | string }): { current: number; target: number } | null => {
    const t = Number(rule.threshold ?? 0);
    switch (rule.type) {
      case "total_sessions_gte":
        return { current: sessions ?? 0, target: t };
      case "streak_length_gte":
        return { current: streak?.current_streak ?? 0, target: t };
      case "cumulative_reps_gte":
        return { current: reps, target: t };
      case "cumulative_minutes_gte":
        return { current: minutes, target: t };
      case "friend_count_gte":
        return { current: friends ?? 0, target: t };
      case "fistbumps_given_gte":
        return { current: bumps ?? 0, target: t };
      default:
        return null;
    }
  };

  const tiles: BadgeTile[] = (catalog ?? []).map((b) => {
    const earned = earnedAt.get(b.id) ?? null;
    const secret = b.section === "special" && !earned;
    const prog = earned || secret ? null : progressFor(b.unlock_rule as { type: string; threshold?: number });
    return {
      key: b.key,
      section: b.section,
      name: secret ? "???" : b.name,
      description: secret ? "Secret badge — keep training to find out." : b.description,
      earnedAt: earned ? new Date(earned).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : null,
      progress: prog && prog.target > 0 ? prog : null,
      secret,
    };
  });

  return <BadgesScreen tiles={tiles} earnedCount={earnedAt.size} totalCount={(catalog ?? []).length} />;
}
