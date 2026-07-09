"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function sendFriendRequest(addresseeId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const { count } = await supabase
    .from("friend_requests")
    .select("id", { count: "exact", head: true })
    .eq("requester_id", user.id)
    .eq("status", "pending");
  if ((count ?? 0) >= 20) throw new Error("Too many pending requests");

  await supabase.from("friend_requests").insert({ requester_id: user.id, addressee_id: addresseeId });
  revalidatePath("/friends");
}

export async function respondToRequest(requesterId: string, accept: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  await supabase
    .from("friend_requests")
    .update({ status: accept ? "accepted" : "declined" })
    .eq("requester_id", requesterId)
    .eq("addressee_id", user.id)
    .eq("status", "pending");

  if (accept) {
    const [a, b] = [user.id, requesterId].sort();
    await supabase.from("friendships").insert({ user_a: a, user_b: b });
  }
  revalidatePath("/friends");
}

export async function toggleFistBump(eventId: string, bumped: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  if (bumped) {
    await supabase.from("fist_bumps").insert({ event_id: eventId, from_user_id: user.id });
  } else {
    await supabase.from("fist_bumps").delete().eq("event_id", eventId).eq("from_user_id", user.id);
  }
}
