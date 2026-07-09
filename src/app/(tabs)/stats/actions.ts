"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addWeighIn(weightKg: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  await supabase.from("weigh_ins").insert({ user_id: user.id, weight_kg: weightKg });
  await supabase.from("profiles").update({ weight_kg: weightKg }).eq("user_id", user.id);
  revalidatePath("/stats");
}
