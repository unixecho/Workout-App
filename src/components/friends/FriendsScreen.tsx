"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { Sheet } from "@/components/Sheet";
import { respondToRequest, sendFriendRequest, toggleFistBump } from "@/app/(tabs)/friends/actions";

export interface FeedItem {
  eventId: string;
  name: string;
  type: "session" | "badge";
  text: string;
  context: string | null;
  when: string;
  bumpCount: number;
  bumpedByMe: boolean;
}

export interface FriendCard {
  userId: string;
  handle: string;
  name: string;
  streak: number;
  relation: "friend" | "incoming" | "outgoing";
}

export function FriendsScreen({ feed, people }: { feed: FeedItem[]; people: FriendCard[] }) {
  const [segment, setSegment] = useState<"activity" | "friends">("activity");
  const [addOpen, setAddOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ user_id: string; handle: string; display_name: string }[]>([]);
  const [sentTo, setSentTo] = useState<Set<string>>(new Set());
  const [bumps, setBumps] = useState(() => new Map(feed.map((f) => [f.eventId, { count: f.bumpCount, mine: f.bumpedByMe }])));
  const [pending, startTransition] = useTransition();

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
    const cur = bumps.get(item.eventId) ?? { count: 0, mine: false };
    const next = { count: cur.count + (cur.mine ? -1 : 1), mine: !cur.mine };
    setBumps(new Map(bumps).set(item.eventId, next));
    startTransition(() => toggleFistBump(item.eventId, next.mine));
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
          feed.length === 0 ? (
            <EmptyState onAdd={() => setAddOpen(true)} />
          ) : (
            feed.map((f) => {
              const b = bumps.get(f.eventId) ?? { count: f.bumpCount, mine: f.bumpedByMe };
              return (
                <div
                  key={f.eventId}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    background: "var(--card)",
                    border: "1px solid var(--card-border)",
                    borderLeft: f.type === "badge" ? "3px solid var(--green)" : "1px solid var(--card-border)",
                    borderRadius: 16,
                    padding: 14,
                  }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 999, background: "rgba(61,139,253,0.18)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, color: "var(--blue)", flexShrink: 0 }}>
                    {f.name.slice(0, 1).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em" }}>
                      {f.name} <span style={{ fontWeight: 500, color: "var(--ink-dim)" }}>{f.text}</span>
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 3, fontSize: 12.5, fontWeight: 500, color: "var(--ink-faint)" }}>
                      {f.context && <span>{f.context}</span>}
                      <span>{f.when}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => bump(f)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      borderRadius: 999,
                      padding: "8px 13px",
                      fontSize: 14,
                      fontWeight: 700,
                      background: b.mine ? "rgba(61,139,253,0.18)" : "var(--fill-resting)",
                      color: b.mine ? "var(--blue)" : "var(--ink-dim)",
                      transition: "transform .15s ease, background .2s ease",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    👊{b.count > 0 && <span>{b.count}</span>}
                  </button>
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
                    {friends.map((f, i) => (
                      <div key={f.userId} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderTop: i === 0 ? "none" : "1px solid var(--hairline)" }}>
                        <Avatar name={f.name} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 16, fontWeight: 600 }}>{f.name}</div>
                          <div style={{ fontSize: 12.5, color: "var(--ink-faint)" }}>@{f.handle}</div>
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "var(--blue)", fontVariantNumeric: "tabular-nums" }}>🔥 {f.streak}</span>
                      </div>
                    ))}
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
