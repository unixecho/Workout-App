import { getActivePlan, mondayIndex, requireProfile } from "@/lib/data";
import { StatsScreen } from "@/components/stats/StatsScreen";

export default async function StatsPage() {
  const { supabase, user, profile } = await requireProfile();

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - mondayIndex(now));
  weekStart.setHours(0, 0, 0, 0);

  // One parallel round trip for everything independent (Sydney→user RTT is
  // the cost driver, not query weight).
  const [
    { data: streak },
    { data: logs },
    plan,
    { data: weighIns },
    { data: exLogs },
    { count: badgesEarned },
    { count: badgesTotal },
  ] = await Promise.all([
    supabase
      .from("streaks")
      .select("current_streak, longest_streak, freeze_count")
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("workout_logs")
      .select("id, plan_day_id, started_at, duration_seconds, total_reps, status")
      .eq("user_id", user.id)
      .eq("status", "complete")
      .order("started_at", { ascending: false }),
    getActivePlan(supabase, user.id),
    supabase.from("weigh_ins").select("weight_kg, logged_at").eq("user_id", user.id).order("logged_at"),
    supabase
      .from("exercise_logs")
      .select("sets_completed, exercises(slug, name, muscle_groups), workout_logs!inner(user_id, status, started_at)")
      .eq("workout_logs.user_id", user.id)
      .eq("workout_logs.status", "complete")
      .eq("removed", false),
    supabase
      .from("user_badges")
      .select("badge_id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .not("earned_at", "is", null),
    supabase.from("badges").select("id", { count: "exact", head: true }),
  ]);
  const completed = logs ?? [];

  const thisWeekDone = completed.filter((l) => new Date(l.started_at) >= weekStart).length;
  const thisWeekPlanned = plan?.days.filter((d) => !d.is_rest_day).length ?? 0;

  // 8-week consistency: bucket 7 = current week, bucket 0 = 7 weeks back
  const weeks: number[] = Array.from({ length: 8 }, () => 0);
  const earliest = weekStart.getTime() - 7 * 7 * 86400000;
  for (const l of completed) {
    const w = Math.floor((new Date(l.started_at).getTime() - earliest) / (7 * 86400000));
    if (w >= 0 && w < 8) weeks[w] += 1;
  }

  const balance: Record<string, number> = {};
  const exercisePRs: Array<{ name: string; weight: number }> = [];
  // slug → per-session top weight, keyed by workout start time
  const bySlug = new Map<string, { name: string; sessions: Map<string, number> }>();
  for (const l of exLogs ?? []) {
    const exercise = l.exercises as unknown as { slug: string; name: string; muscle_groups: string[] };
    const log = l.workout_logs as unknown as { started_at: string };
    const muscles = exercise?.muscle_groups ?? [];
    const sets = Array.isArray(l.sets_completed) ? l.sets_completed.length : 1;
    for (const m of muscles) {
      if (m === "Mobility" || m === "Warmup") continue;
      balance[m] = (balance[m] ?? 0) + sets;
    }
    // Per-exercise PRs: max weight logged
    if (Array.isArray(l.sets_completed)) {
      let topSet = 0;
      for (const set of l.sets_completed) {
        const weight = typeof set === "number" ? 0 : (set?.weight ?? 0);
        if (weight > 0) {
          topSet = Math.max(topSet, weight);
          const existing = exercisePRs.find((p) => p.name === exercise?.name);
          if (existing) {
            existing.weight = Math.max(existing.weight, weight);
          } else {
            exercisePRs.push({ name: exercise?.name ?? "Unknown", weight });
          }
        }
      }
      if (topSet > 0 && exercise?.slug && log?.started_at) {
        let entry = bySlug.get(exercise.slug);
        if (!entry) {
          entry = { name: exercise.name, sessions: new Map() };
          bySlug.set(exercise.slug, entry);
        }
        entry.sessions.set(log.started_at, Math.max(entry.sessions.get(log.started_at) ?? 0, topSet));
      }
    }
  }
  const topPRs = exercisePRs
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 5);

  // Loading progression: exercises with ≥2 weighted sessions, heaviest first
  const progression = [...bySlug.entries()]
    .map(([slug, { name, sessions }]) => ({
      slug,
      name,
      points: [...sessions.entries()]
        .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
        .map(([at, weight]) => ({ at, weight })),
    }))
    .filter((e) => e.points.length >= 2)
    .sort((a, b) => Math.max(...b.points.map((p) => p.weight)) - Math.max(...a.points.map((p) => p.weight)))
    .slice(0, 6);

  // History with day titles
  const dayTitles = new Map((plan?.days ?? []).map((d) => [d.id, d.session_title ?? "Workout"]));

  return (
    <StatsScreen
      streak={streak?.current_streak ?? 0}
      longest={streak?.longest_streak ?? 0}
      freezes={streak?.freeze_count ?? 0}
      weekDone={thisWeekDone}
      weekPlanned={thisWeekPlanned}
      consistency={weeks}
      weighIns={(weighIns ?? []).map((w) => ({ kg: Number(w.weight_kg), at: w.logged_at }))}
      currentWeightKg={profile.weight_kg ? Number(profile.weight_kg) : null}
      targetWeightKg={profile.target_weight_kg ? Number(profile.target_weight_kg) : null}
      totals={{
        workouts: completed.length,
        minutes: Math.round(completed.reduce((a, l) => a + (l.duration_seconds ?? 0), 0) / 60),
        reps: completed.reduce((a, l) => a + (l.total_reps ?? 0), 0),
      }}
      balance={Object.entries(balance)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)}
      prs={topPRs}
      progression={progression}
      badges={{ earned: badgesEarned ?? 0, total: badgesTotal ?? 0 }}
      history={completed.slice(0, 8).map((l) => ({
        title: dayTitles.get(l.plan_day_id) ?? "Workout",
        date: new Date(l.started_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        minutes: Math.round((l.duration_seconds ?? 0) / 60),
      }))}
    />
  );
}
