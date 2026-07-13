import { getActivePlan, mondayIndex, requireProfile } from "@/lib/data";
import { getI18n } from "@/lib/i18n/server";
import { PlanScreen } from "@/components/plan/PlanScreen";

export default async function PlanPage() {
  const { supabase, user } = await requireProfile();
  const { t } = await getI18n();
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
      planName={plan?.name ? (t.content.planNames[plan.name] ?? plan.name) : t.plan.myPlan}
      days={plan?.days ?? []}
      todayIdx={mondayIndex(new Date())}
      completedDayIds={completedDayIds}
      completedDates={completedDates}
    />
  );
}
