"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Sheet } from "@/components/Sheet";
import { feedItemFrom, type ActivityEventRow, type FeedItem } from "@/lib/feed";
import { pokeFriend, respondToRequest, sendFriendRequest, toggleFistBump } from "@/app/(tabs)/friends/actions";

export type { FeedItem };

export interface FriendCard {
  userId: string;
  handle: string;
  name: string;
  streak: number;
  relation: "friend" | "incoming" | "outgoing";
}

export function FriendsScreen({ feed, people, userId }: { feed: FeedItem[]; people: FriendCard[]; userId: string }) {
  const router = useRouter();
  const [segment, setSegment] = useState<"activity" | "friends">("activity");
  const [addOpen, setAddOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ user_id: string; handle: string; display_name: string }[]>([]);
  const [sentTo, setSentTo] = useState<Set<string>>(new Set());
  const [items, setItems] = useState<FeedItem[]>(feed);
  const [freshIds, setFreshIds] = useState<Set<string>>(new Set());
  const [pokedIds, setPokedIds] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();
  const itemsRef = useRef(items);
  itemsRef.current = items;

  // Live feed (docs/TD.md § Realtime usage): new feed_entries rows animate in
  // at the top, fist-bump counts stay in sync across clients, and an incoming
  // friend request refreshes the server-rendered people list.
  //
  // The realtime socket must carry the user's access token or it connects as
  // `anon` and RLS filters out every row — so set auth before subscribing.
  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled) return;
      await supabase.realtime.setAuth(session?.access_token ?? null);
      channel = supabase
        .channel("friends-live")
        .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "feed_entries", filter: `recipient_id=eq.${userId}` },
        async (payload) => {
          const eventId = payload.new.event_id as string;
          const createdAt = (payload.new.created_at as string) ?? new Date().toISOString();
          if (itemsRef.current.some((i) => i.eventId === eventId)) return;
          const { data: ev } = await supabase
            .from("activity_events")
            .select("id, user_id, type, payload")
            .eq("id", eventId)
            .single();
          if (!ev) return;
          const item = feedItemFrom(eventId, createdAt, ev as ActivityEventRow, userId);
          setItems((prev) => (prev.some((i) => i.eventId === eventId) ? prev : [item, ...prev]));
          setFreshIds((prev) => new Set(prev).add(eventId));
        },
      )
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "fist_bumps" }, (payload) => {
        const eventId = payload.new.event_id as string;
        if ((payload.new.from_user_id as string) === userId) return; // own tap is optimistic
        setItems((prev) => prev.map((i) => (i.eventId === eventId ? { ...i, bumpCount: i.bumpCount + 1 } : i)));
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "fist_bumps" }, (payload) => {
        const eventId = payload.old.event_id as string;
        if ((payload.old.from_user_id as string) === userId) return;
        setItems((prev) =>
          prev.map((i) => (i.eventId === eventId ? { ...i, bumpCount: Math.max(0, i.bumpCount - 1) } : i)),
        );
      })
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "friend_requests", filter: `addressee_id=eq.${userId}` },
          () => router.refresh(),
        )
        .subscribe();
    })();
    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [userId, router]);

  const friends = people.filter((p) => p.relation === "friend");
  const incoming = people.filter((p) => p.relation === "incoming");
  const knownIds = new Set(people.map((p) => p.userId));

  async function search(q: string) {
    setQuery(q);
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    const { data } = await createClient().rpc("search_profiles", { q: q.trim() });
    setResults(data ?? []);
  }

  function bump(item: FeedItem) {
    const mine = !item.bumpedByMe;
    setItems((prev) =>
      prev.map((i) =>
        i.eventId === item.eventId ? { ...i, bumpedByMe: mine, bumpCount: Math.max(0, i.bumpCount + (mine ? 1 : -1)) } : i,
      ),
    );
    startTransition(() => toggleFistBump(item.eventId, mine));
  }

  function poke(friend: FriendCard) {
    if (pokedIds.has(friend.userId)) return;
    setPokedIds((prev) => new Set(prev).add(friend.userId));
    startTransition(() => pokeFriend(friend.userId));
  }

  return (
    <main style={{ minHeight: "100%", paddingBottom: 24 }}>
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          padding: "calc(var(--safe-top) + 14px) 20px 12px",
          background: "linear-gradient(to bottom, rgba(10,13,18,0.96) 60%, rgba(10,13,18,0))",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-0.02em" }}>Friends</div>
          <button
            aria-label="Add friend"
            onClick={() => setAddOpen(true)}
            style={{ width: 36, height: 36, borderRadius: 999, background: "rgba(61,139,253,0.14)", color: "var(--blue)", fontSize: 22, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            +
          </button>
        </div>
        <div style={{ display: "flex", background: "var(--fill-resting)", borderRadius: 10, padding: 2, marginTop: 14 }}>
          {(["activity", "friends"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSegment(s)}
              style={{
                flex: 1,
                padding: "9px 0",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                textTransform: "capitalize",
                background: segment === s ? "rgba(61,139,253,0.18)" : "transparent",
                color: segment === s ? "var(--blue)" : "var(--ink-dim)",
                transition: "background .2s ease, color .2s ease",
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "8px 16px 0", display: "flex", flexDirection: "column", gap: 10 }}>
        {segment === "activity" ? (
          items.length === 0 ? (
            <EmptyState onAdd={() => setAddOpen(true)} />
          ) : (
            items.map((f) => {
              const clickable = f.type === "badge";
              const bumpable = f.type === "session" || f.type === "badge";
              const accent = f.type === "poke" ? "var(--blue)" : "var(--green)";
              const emphasized = f.type === "badge" || f.type === "poke" || f.type === "friendship";
              const avatarGlyph =
                f.type === "poke" ? "👊" : f.type === "friendship" ? "🤝" : f.name.slice(0, 1).toUpperCase();
              return (
                <div
                  key={f.eventId}
                  onClick={clickable ? () => router.push("/badges") : undefined}
                  role={clickable ? "link" : undefined}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    background: "var(--card)",
                    border: "1px solid var(--card-border)",
                    borderLeft: emphasized ? `3px solid ${accent}` : "1px solid var(--card-border)",
                    borderRadius: 16,
                    padding: 14,
                    cursor: clickable ? "pointer" : "default",
                    animation: freshIds.has(f.eventId) ? "feed-in .45s cubic-bezier(.4,0,.2,1) both" : undefined,
                  }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 999, background: f.own ? "rgba(48,209,88,0.18)" : "rgba(61,139,253,0.18)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: f.type === "poke" || f.type === "friendship" ? 18 : 15, fontWeight: 700, color: f.own ? "var(--green)" : "var(--blue)", flexShrink: 0 }}>
                    {avatarGlyph}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em" }}>
                      {f.name} <span style={{ fontWeight: 500, color: "var(--ink-dim)" }}>{f.text}</span>
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 3, fontSize: 12.5, fontWeight: 500, color: "var(--ink-faint)" }}>
                      {f.context && <span>{f.context}</span>}
                      <span>{f.when}</span>
                      {clickable && <span style={{ color: "var(--green)" }}>View badges ›</span>}
                    </div>
                  </div>
                  {bumpable && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        bump(f);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        borderRadius: 999,
                        padding: "8px 13px",
                        fontSize: 14,
                        fontWeight: 700,
                        background: f.bumpedByMe ? "rgba(61,139,253,0.18)" : "var(--fill-resting)",
                        color: f.bumpedByMe ? "var(--blue)" : "var(--ink-dim)",
                        transition: "transform .15s ease, background .2s ease",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      👊{f.bumpCount > 0 && <span>{f.bumpCount}</span>}
                    </button>
                  )}
                </div>
              );
            })
          )
        ) : (
          <>
            {incoming.length > 0 && (
              <>
                <SectionLabel text="Requests" />
                {incoming.map((r) => (
                  <div key={r.userId} style={rowCard()}>
                    <Avatar name={r.name} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 16, fontWeight: 600 }}>{r.name}</div>
                      <div style={{ fontSize: 12.5, color: "var(--ink-faint)" }}>@{r.handle}</div>
                    </div>
                    <button
                      disabled={pending}
                      onClick={() => startTransition(() => respondToRequest(r.userId, true))}
                      style={{ borderRadius: 999, padding: "8px 16px", fontSize: 13, fontWeight: 700, background: "rgba(61,139,253,0.18)", color: "var(--blue)" }}
                    >
                      Accept
                    </button>
                    <button
                      disabled={pending}
                      onClick={() => startTransition(() => respondToRequest(r.userId, false))}
                      style={{ borderRadius: 999, padding: "8px 14px", fontSize: 13, fontWeight: 700, background: "var(--fill-resting)", color: "var(--ink-dim)" }}
                    >
                      Decline
                    </button>
                  </div>
                ))}
              </>
            )}
            {friends.length === 0 && incoming.length === 0 ? (
              <EmptyState onAdd={() => setAddOpen(true)} />
            ) : (
              friends.length > 0 && (
                <>
                  <SectionLabel text="Friends" />
                  <div style={{ background: "var(--card)", border: "1px solid var(--card-border)", borderRadius: 16, overflow: "hidden" }}>
                    {friends.map((f, i) => {
                      const poked = pokedIds.has(f.userId);
                      return (
                        <div key={f.userId} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderTop: i === 0 ? "none" : "1px solid var(--hairline)" }}>
                          <Avatar name={f.name} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 16, fontWeight: 600 }}>{f.name}</div>
                            <div style={{ fontSize: 12.5, color: "var(--ink-faint)" }}>@{f.handle}</div>
                          </div>
                          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--blue)", fontVariantNumeric: "tabular-nums" }}>🔥 {f.streak}</span>
                          <button
                            aria-label={poked ? `Fist-bumped ${f.name}` : `Fist-bump ${f.name}`}
                            onClick={() => poke(f)}
                            disabled={poked}
                            className={poked ? undefined : "bump-nudge"}
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: 999,
                              flexShrink: 0,
                              fontSize: 18,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              background: poked ? "rgba(48,209,88,0.16)" : "rgba(61,139,253,0.14)",
                              transition: "transform .15s ease, background .2s ease",
                            }}
                          >
                            {poked ? "✅" : "👊"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </>
              )
            )}
          </>
        )}
      </div>

      {/* Add friend sheet */}
      <Sheet open={addOpen} onClose={() => setAddOpen(false)} title="Add friend">
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--fill-resting)", borderRadius: 12, padding: "10px 12px", marginBottom: 12 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: "var(--ink-faint)" }}>@</span>
          <input
            value={query}
            onChange={(e) => search(e.target.value)}
            placeholder="Search handles"
            autoCapitalize="none"
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "var(--ink)", fontSize: 16, fontWeight: 500 }}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, minHeight: 60 }}>
          {results.map((r) => {
            const already = knownIds.has(r.user_id) || sentTo.has(r.user_id);
            return (
              <div key={r.user_id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 4px" }}>
                <Avatar name={r.display_name ?? r.handle} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{r.display_name ?? r.handle}</div>
                  <div style={{ fontSize: 12.5, color: "var(--ink-faint)" }}>@{r.handle}</div>
                </div>
                <button
                  disabled={already || pending}
                  onClick={() =>
                    startTransition(async () => {
                      await sendFriendRequest(r.user_id);
                      setSentTo((prev) => new Set(prev).add(r.user_id));
                    })
                  }
                  style={{
                    borderRadius: 999,
                    padding: "8px 16px",
                    fontSize: 13,
                    fontWeight: 700,
                    background: already ? "var(--fill-resting)" : "rgba(61,139,253,0.18)",
                    color: already ? "var(--ink-faint)" : "var(--blue)",
                  }}
                >
                  {sentTo.has(r.user_id) ? "Sent ✓" : already ? "Added" : "Add"}
                </button>
              </div>
            );
          })}
          {query.length >= 2 && results.length === 0 && (
            <div style={{ padding: 16, textAlign: "center", fontSize: 13.5, color: "var(--ink-faint)" }}>No one found with that handle.</div>
          )}
        </div>
      </Sheet>
    </main>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "48px 24px", textAlign: "center" }}>
      <div style={{ fontSize: 40 }}>🤝</div>
      <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.01em" }}>Training is better with backup</div>
      <div style={{ fontSize: 14, fontWeight: 500, color: "var(--ink-dim)", lineHeight: 1.5 }}>
        Friends see your workouts, you see theirs, and streaks get a lot harder to break.
      </div>
      <button onClick={onAdd} style={{ marginTop: 8, borderRadius: 12, padding: "13px 28px", fontSize: 15, fontWeight: 700, background: "rgba(61,139,253,0.14)", color: "var(--blue)" }}>
        Add friend
      </button>
    </div>
  );
}

function SectionLabel({ text }: { text: string }) {
  return <div style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-faint)", margin: "8px 4px 0" }}>{text}</div>;
}

function Avatar({ name }: { name: string }) {
  return (
    <div style={{ width: 40, height: 40, borderRadius: 999, background: "rgba(61,139,253,0.18)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, color: "var(--blue)", flexShrink: 0 }}>
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}

function rowCard(): React.CSSProperties {
  return { display: "flex", alignItems: "center", gap: 10, background: "var(--card)", border: "1px solid var(--card-border)", borderRadius: 16, padding: 14 };
}
