/**
 * Shared feed-item shape + builder (FD §11). Used by the Friends server page
 * for the initial render and by the client realtime handler when new
 * feed_entries rows arrive, so both produce identical copy.
 *
 * Perspective: your own events read as "You finished …" / "You earned …";
 * friends' events read as "John finished …". Badge events link to /badges.
 */

export interface ActivityEventRow {
  id: string;
  user_id: string;
  type: string;
  payload: Record<string, string | number>;
}

export interface FeedItem {
  eventId: string;
  name: string;
  own: boolean;
  /** The event's actor (ev.user_id) — who to fist-bump back on a `poke`. */
  actorUserId: string | null;
  type: "session" | "badge" | "friendship" | "poke";
  text: string;
  context: string | null;
  when: string;
  bumpCount: number;
  bumpedByMe: boolean;
}

export function feedItemFrom(
  eventId: string,
  createdAt: string,
  ev: ActivityEventRow | null,
  meId: string,
  bumpCount = 0,
  bumpedByMe = false,
): FeedItem {
  const own = ev?.user_id === meId;
  const when = new Date(createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const base = { eventId, own, actorUserId: ev?.user_id ?? null, context: null as string | null, when, bumpCount, bumpedByMe };

  if (ev?.type === "friendship") {
    // Symmetric copy: "You and Mike are now friends" for either party, or
    // "John and Mike are now friends" for a third-party friend seeing it.
    const meIsFriend = meId === String(ev.payload?.friend_user_id ?? "");
    const other = own ? ev.payload?.friend_name : meIsFriend ? ev.payload?.actor_name : ev.payload?.friend_name;
    const first = own || meIsFriend ? "You" : String(ev.payload?.actor_name ?? "Someone");
    return { ...base, name: first, type: "friendship", text: `and ${other ?? "a friend"} are now friends 🤝` };
  }

  if (ev?.type === "poke") {
    // Always shown to the target only (fanout special-cases this type).
    return { ...base, name: String(ev.payload?.actor_name ?? "A friend"), type: "poke", text: "fist-bumped you 👊" };
  }

  const badge = ev?.type === "badge_earned";
  return {
    ...base,
    name: own ? "You" : String(ev?.payload?.actor_name ?? "A friend"),
    type: badge ? "badge" : "session",
    context: ev?.payload?.streak ? `🔥 ${ev.payload.streak} streak` : null,
    text: badge
      ? `${own ? "earned" : "has earned"} ${ev?.payload?.badge_name ?? "a badge"} 🏅`
      : `${own ? "finished" : "has finished"} ${ev?.payload?.session_title ?? "a workout"}`,
  };
}
