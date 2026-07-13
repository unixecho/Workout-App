/**
 * Shared feed-item shape + builder (FD §11). Used by the Friends server page
 * for the initial render and by the client realtime handler when new
 * feed_entries rows arrive, so both produce identical copy.
 *
 * Perspective: your own events read as "You finished …" / "You earned …";
 * friends' events read as "John finished …". Badge events link to /badges.
 * All copy comes from the locale dictionary (docs/I18N.md §3).
 */

import { getDictionary, type Locale } from "@/lib/i18n";
import { formatDate } from "@/lib/i18n/format";

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
  locale: Locale,
  bumpCount = 0,
  bumpedByMe = false,
): FeedItem {
  const t = getDictionary(locale);
  const own = ev?.user_id === meId;
  const when = formatDate(locale, createdAt, { month: "short", day: "numeric" });
  const base = { eventId, own, actorUserId: ev?.user_id ?? null, context: null as string | null, when, bumpCount, bumpedByMe };

  if (ev?.type === "friendship") {
    // Symmetric copy: "You and Mike are now friends" for either party, or
    // "John and Mike are now friends" for a third-party friend seeing it.
    const meIsFriend = meId === String(ev.payload?.friend_user_id ?? "");
    const other = own ? ev.payload?.friend_name : meIsFriend ? ev.payload?.actor_name : ev.payload?.friend_name;
    const first = own || meIsFriend ? t.feed.you : String(ev.payload?.actor_name ?? t.feed.someone);
    return { ...base, name: first, type: "friendship", text: t.feed.nowFriends(String(other ?? t.feed.aFriend)) };
  }

  if (ev?.type === "poke") {
    // Always shown to the target only (fanout special-cases this type).
    return { ...base, name: String(ev.payload?.actor_name ?? t.feed.aFriend), type: "poke", text: t.feed.poked };
  }

  const badge = ev?.type === "badge_earned";
  // DB payloads carry English content strings; translate the known ones and
  // fall back to the stored text (docs/I18N.md §8).
  const badgeName = ev?.payload?.badge_name
    ? (t.content.badgesByName[String(ev.payload.badge_name)] ?? String(ev.payload.badge_name))
    : t.feed.aBadge;
  const sessionTitle = ev?.payload?.session_title
    ? (t.content.dayTitles[String(ev.payload.session_title)] ?? String(ev.payload.session_title))
    : t.feed.aWorkout;
  return {
    ...base,
    name: own ? t.feed.you : String(ev?.payload?.actor_name ?? t.feed.aFriend),
    type: badge ? "badge" : "session",
    context: ev?.payload?.streak ? t.feed.streakContext(Number(ev.payload.streak)) : null,
    text: badge ? (own ? t.feed.earnedOwn(badgeName) : t.feed.earnedFriend(badgeName)) : own ? t.feed.finishedOwn(sessionTitle) : t.feed.finishedFriend(sessionTitle),
  };
}
