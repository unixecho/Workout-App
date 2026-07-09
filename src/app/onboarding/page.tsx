import { createClient } from "@/lib/supabase/server";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import type { Equipment, Goal } from "@/lib/plan/generate";
import { redirect } from "next/navigation";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <OnboardingFlow initialStep={0} initialProfile={null} />;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "handle, display_name, age, height_cm, weight_kg, unit_pref, goal, target_weight_kg, weekday_availability, equipment, limitations",
    )
    .eq("user_id", user.id)
    .single();

  // A handle is only ever set at the very end of completeOnboarding — its
  // presence means this user already finished the flow. Without this check,
  // any authenticated user landing on /onboarding got dropped back into
  // step 2 every time, even long after they'd completed it.
  if (profile?.handle) {
    redirect("/today");
  }

  return (
    <OnboardingFlow
      initialStep={1}
      initialProfile={
        profile
          ? {
              handle: profile.handle,
              displayName: profile.display_name,
              age: profile.age,
              heightCm: profile.height_cm,
              weightKg: profile.weight_kg,
              unitPref: profile.unit_pref as "metric" | "imperial",
              goal: profile.goal as Goal | null,
              targetWeightKg: profile.target_weight_kg,
              weekdayAvailability: profile.weekday_availability,
              equipment: profile.equipment as Equipment,
              limitations: profile.limitations,
            }
          : null
      }
    />
  );
}
