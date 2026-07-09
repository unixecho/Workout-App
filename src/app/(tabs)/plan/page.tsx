import { getActivePlan, mondayIndex, requireProfile } from "@/lib/data";
import { PlanScreen } from "@/components/plan/PlanScreen";

export default async function PlanPage() {
  const { supabase, user } = await requireProfile();
  const plan = await getActivePlan(supabase, user.id);

  const { data: doneLogs } = await supabase
    .from("workout_logs")
    .select("plan_day_id, completed_at")
    .eq("user_id", user.id)
    .eq("status", "complete");
  const completedDayIds = (doneLogs ?? []).map((l) => l.plan_day_id as string);
  const completedDates = (doneLogs ?? [])
    .map((l) => l.completed_at as string | null)
    .filter((d): d is string => !!d);

  return (
    <PlanScreen
      planName={plan?.name ?? "My Plan"}
      days={plan?.days ?? []}
      todayIdx={mondayIndex(new Date())}
      completedDayIds={completedDayIds}
      completedDates={completedDates}
    />
  );
}
