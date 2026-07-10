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
  type: "session" | "badge";
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
  const badge = ev?.type === "badge_earned";
  return {
    eventId,
    name: own ? "You" : String(ev?.payload?.actor_name ?? "A friend"),
    own,
    type: badge ? "badge" : "session",
    text: badge
      ? `${own ? "earned" : "has earned"} ${ev?.payload?.badge_name ?? "a badge"} 🏅`
      : `${own ? "finished" : "has finished"} ${ev?.payload?.session_title ?? "a workout"}`,
    context: ev?.payload?.streak ? `🔥 ${ev.payload.streak} streak` : null,
    when: new Date(createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    bumpCount,
    bumpedByMe,
  };
}
