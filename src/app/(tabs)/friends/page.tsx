import { requireProfile } from "@/lib/data";
import { feedItemFrom, type ActivityEventRow, type FeedItem } from "@/lib/feed";
import { FriendsScreen, type FriendCard } from "@/components/friends/FriendsScreen";

export default async function FriendsPage() {
  const { supabase, user } = await requireProfile();

  const [{ data: cards }, { data: feedRows }] = await Promise.all([
    supabase.rpc("friend_cards"),
    supabase
      .from("feed_entries")
      .select("event_id, created_at, activity_events(id, user_id, type, payload)")
      .eq("recipient_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);
  const people: FriendCard[] = (cards ?? []).map(
    (c: { user_id: string; handle: string; display_name: string; current_streak: number; relation: string }) => ({
      userId: c.user_id,
      handle: c.handle,
      name: c.display_name ?? c.handle,
      streak: c.current_streak,
      relation: c.relation as FriendCard["relation"],
    }),
  );

  const eventIds = (feedRows ?? []).map((f) => f.event_id);
  const { data: bumps } = eventIds.length
    ? await supabase.from("fist_bumps").select("event_id, from_user_id").in("event_id", eventIds)
    : { data: [] };

  const feed: FeedItem[] = (feedRows ?? []).map((f) => {
    const ev = f.activity_events as unknown as ActivityEventRow;
    const evBumps = (bumps ?? []).filter((b) => b.event_id === f.event_id);
    return feedItemFrom(
      f.event_id,
      f.created_at,
      ev,
      user.id,
      evBumps.length,
      evBumps.some((b) => b.from_user_id === user.id),
    );
  });

  return <FriendsScreen feed={feed} people={people} userId={user.id} />;
}
