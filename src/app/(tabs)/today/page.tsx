import { getActivePlan, mondayIndex, requireProfile } from "@/lib/data";
import { feedItemFrom, type ActivityEventRow } from "@/lib/feed";
import { TodayScreen, type WeekTileState } from "@/components/today/TodayScreen";

export default async function TodayPage() {
  const { supabase, user, profile } = await requireProfile();
  const plan = await getActivePlan(supabase, user.id);

  const now = new Date();
  const todayIdx = mondayIndex(now);
  const todayDay = plan?.days.find((d) => d.day_of_week === todayIdx) ?? null;

  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - todayIdx);
  weekStart.setHours(0, 0, 0, 0);

  // Everything independent runs in one round trip — latency is per-trip.
  const [{ data: weekLogs }, { data: streak }, { count: totalSessions }, { data: feed }, { count: total }] =
    await Promise.all([
      supabase
        .from("workout_logs")
        .select("id, plan_day_id, status, started_at, completed_at, duration_seconds")
        .eq("user_id", user.id)
        .gte("started_at", weekStart.toISOString()),
      supabase.from("streaks").select("current_streak").eq("user_id", user.id).single(),
      supabase
        .from("workout_logs")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "complete"),
      supabase
        .from("feed_entries")
        .select("event_id, created_at, activity_events(user_id, type, payload, created_at)")
        .eq("recipient_id", user.id)
        .order("created_at", { ascending: false })
        .limit(3),
      todayDay && !todayDay.is_rest_day
        ? supabase
            .from("session_exercises")
            .select("id", { count: "exact", head: true })
            .eq("plan_day_id", todayDay.id)
            .eq("is_optional", false)
        : Promise.resolve({ count: 0 }),
    ]);

  const todayLog =
    weekLogs?.find((l) => l.plan_day_id === todayDay?.id && l.status !== "abandoned") ?? null;

  const exercisesTotal = total ?? 0;
  let exercisesDone = 0;
  if (todayLog && exercisesTotal > 0) {
    const { count: done } = await supabase
      .from("exercise_logs")
      .select("id", { count: "exact", head: true })
      .eq("workout_log_id", todayLog.id)
      .eq("removed", false);
    exercisesDone = done ?? 0;
  }

  // Week strip states
  const weekTiles: WeekTileState[] = (plan?.days ?? []).map((d) => {
    const hasComplete = weekLogs?.some((l) => l.plan_day_id === d.id && l.status === "complete");
    if (d.day_of_week === todayIdx) return d.is_rest_day ? "rest" : hasComplete ? "completed" : "today";
    if (d.is_rest_day) return "rest";
    if (hasComplete) return "completed";
    return d.day_of_week < todayIdx ? "missed" : "upcoming";
  });

  // Next badge teaser: closest unearned milestone by total completed sessions
  const milestones = [
    { at: 1, name: "First Rep" },
    { at: 10, name: "10 Workouts" },
    { at: 50, name: "50 Workouts" },
    { at: 100, name: "100 Workouts" },
  ];
  const next = milestones.find((m) => (totalSessions ?? 0) < m.at) ?? null;

  return (
    <TodayScreen
      firstName={(profile.display_name ?? "there").split(" ")[0]}
      streak={streak?.current_streak ?? 0}
      todayDay={todayDay}
      todayLogStatus={(todayLog?.status as "in_progress" | "complete" | undefined) ?? null}
      todayDurationMin={todayLog?.duration_seconds ? Math.round(todayLog.duration_seconds / 60) : null}
      exercisesDone={exercisesDone}
      exercisesTotal={exercisesTotal}
      weekTiles={weekTiles}
      weekDayNumbers={Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + i);
        return d.getDate();
      })}
      todayIdx={todayIdx}
      badgeTeaser={next ? { name: next.name, toGo: next.at - (totalSessions ?? 0), frac: (totalSessions ?? 0) / next.at } : null}
      feed={(feed ?? []).map((f) => {
        const ev = { id: f.event_id, ...(f.activity_events as object) } as ActivityEventRow;
        const item = feedItemFrom(f.event_id, f.created_at, ev, user.id);
        return { name: item.name, text: item.text, when: item.when };
      })}
      dateLabel={now
        .toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })
        .toUpperCase()}
    />
  );
}
