"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

    // Steam-style "you became friends" activity (FD §11). Written with the
    // service role — activity_events has no client insert policy. Fans out to
    // both parties (each is now the other's friend) plus their friends.
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, handle")
      .in("user_id", [user.id, requesterId]);
    const me = profiles?.find((p) => p.user_id === user.id);
    const them = profiles?.find((p) => p.user_id === requesterId);
    await createAdminClient()
      .from("activity_events")
      .insert({
        user_id: user.id,
        type: "friendship",
        visible_to_friends: true,
        payload: {
          actor_name: me?.display_name ?? me?.handle ?? "Someone",
          actor_handle: me?.handle ?? "",
          friend_name: them?.display_name ?? them?.handle ?? "a friend",
          friend_handle: them?.handle ?? "",
          friend_user_id: requesterId,
        },
      });
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

/**
 * Direct fist-bump to a friend from their card (FD §11 social nudge). Emits a
 * `poke` activity_event that the fanout trigger routes ONLY to the target's
 * feed, so they get a live "X fist-bumped you 👊" notification. Guarded to
 * friends only, and to a light rate to avoid spam.
 */
export async function pokeFriend(targetUserId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  if (targetUserId === user.id) throw new Error("Can't bump yourself");

  // Must actually be friends.
  const [a, b] = [user.id, targetUserId].sort();
  const { data: friendship } = await supabase
    .from("friendships")
    .select("user_a")
    .eq("user_a", a)
    .eq("user_b", b)
    .maybeSingle();
  if (!friendship) throw new Error("Not friends");

  const { data: me } = await supabase
    .from("profiles")
    .select("display_name, handle")
    .eq("user_id", user.id)
    .single();

  await createAdminClient()
    .from("activity_events")
    .insert({
      user_id: user.id,
      type: "poke",
      visible_to_friends: false,
      payload: {
        actor_name: me?.display_name ?? me?.handle ?? "A friend",
        actor_handle: me?.handle ?? "",
        target_user_id: targetUserId,
      },
    });
}
