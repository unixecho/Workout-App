"use client";

import Link from "next/link";
import { ProgressRing } from "@/components/ProgressRing";
import { useI18n } from "@/lib/i18n/client";
import { weekdayDisplayOrder } from "@/lib/i18n";
import type { PlanDay } from "@/lib/data";

export type WeekTileState = "completed" | "today" | "upcoming" | "rest" | "missed";

interface Props {
  firstName: string;
  streak: number;
  todayDay: PlanDay | null;
  todayLogStatus: "in_progress" | "complete" | null;
  todayDurationMin: number | null;
  exercisesDone: number;
  exercisesTotal: number;
  weekTiles: WeekTileState[];
  weekDayNumbers: number[];
  todayIdx: number;
  badgeTeaser: { name: string; toGo: number; frac: number } | null;
  feed: { name: string; text: string; when: string }[];
  dateLabel: string;
}

export function TodayScreen(p: Props) {
  const { locale, t } = useI18n();
  const rest = !p.todayDay || p.todayDay.is_rest_day;
  const done = p.todayLogStatus === "complete";
  const inProgress = p.todayLogStatus === "in_progress";
  // Storage is Monday-first everywhere; Hebrew displays Sunday-first
  const order = weekdayDisplayOrder(locale);
  const dayTitle = (title: string) => t.content.dayTitles[title] ?? title;

  return (
    <main style={{ minHeight: "100%", paddingBottom: 24 }}>
      {/* Sticky header */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          padding: "calc(var(--safe-top) + 14px) 20px 16px",
          background: "linear-gradient(180deg, rgba(10,13,18,0.96) 55%, rgba(10,13,18,0.6) 85%, transparent)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.04em", color: "var(--ink-faint)", textTransform: "uppercase" }}>
            {p.dateLabel}
          </div>
          <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.08, marginTop: 3 }}>
            {t.today.greeting(p.firstName)}
          </div>
        </div>
        <div
          style={{
            flex: "none",
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "8px 13px",
            borderRadius: 999,
            background: "rgba(61,139,253,0.14)",
          }}
        >
          <span style={{ fontSize: 15, lineHeight: 1 }}>🔥</span>
          <span style={{ fontSize: 16, fontWeight: 800, color: "var(--blue)", fontVariantNumeric: "tabular-nums" }}>{p.streak}</span>
        </div>
      </div>

      <div style={{ padding: "4px 18px 0", display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Hero card */}
        {rest ? (
          <div style={card()}>
            <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
              <div style={{ flex: "none", width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width={22} height={22} viewBox="0 0 24 24">
                  <path d="M21 12.9A8.5 8.5 0 1 1 11.1 3.2 6.6 6.6 0 0 0 21 12.9Z" fill="var(--ink-dim)" />
                </svg>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--ink-dim)" }}>{t.today.restDay}</div>
                <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: "-0.02em", marginTop: 3 }}>{t.today.restTitle}</div>
              </div>
            </div>
            <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--ink-dim)", marginTop: 12 }}>
              {t.today.restBlurb}
            </div>
          </div>
        ) : done ? (
          <div style={{ ...card(), background: "rgba(48,209,88,0.09)", border: "1px solid rgba(48,209,88,0.22)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
              <div style={{ flex: "none", width: 44, height: 44, borderRadius: 999, background: "rgba(48,209,88,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Check />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--green)" }}>{t.today.completeLabel}</div>
                <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: "-0.02em", marginTop: 2 }}>{dayTitle(p.todayDay!.session_title ?? "")}</div>
              </div>
            </div>
            <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--ink-dim)", marginTop: 12, fontVariantNumeric: "tabular-nums" }}>
              {t.today.exercisesCount(p.exercisesTotal)}
              {p.todayDurationMin ? ` · ${t.common.min(p.todayDurationMin)}` : ""}
            </div>
          </div>
        ) : (
          <div style={{ ...card(), position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse 90% 60% at 100% 0%, rgba(61,139,253,0.10), transparent 55%)" }} />
            <div style={{ position: "relative" }}>
              {inProgress ? (
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <ProgressRing done={p.exercisesDone} total={p.exercisesTotal} size={72} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--green)" }}>{t.today.inProgressLabel}</div>
                    <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: "-0.02em", marginTop: 3 }}>{dayTitle(p.todayDay!.session_title ?? "")}</div>
                    <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--ink-dim)", marginTop: 5, fontVariantNumeric: "tabular-nums" }}>
                      {t.today.exercisesLeft(p.exercisesTotal - p.exercisesDone)}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--blue)" }}>{t.today.todaysWorkout}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", marginTop: 5 }}>{dayTitle(p.todayDay!.session_title ?? "")}</div>
                  <div style={{ display: "flex", gap: 7, marginTop: 12, flexWrap: "wrap" }}>
                    {p.todayDay!.focus_muscles.map((m) => (
                      <span key={m} style={{ padding: "5px 11px", borderRadius: 999, background: "rgba(255,255,255,0.06)", fontSize: 12.5, fontWeight: 600, color: "var(--ink-dim)" }}>
                        {t.content.muscles[m] ?? m}
                      </span>
                    ))}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, fontSize: 13.5, fontWeight: 500, color: "var(--ink-dim)", fontVariantNumeric: "tabular-nums" }}>
                    <span>{t.common.min(p.todayDay!.est_duration_min ?? 45)}</span>
                    <span style={{ color: "var(--ink-faint)" }}>·</span>
                    <span>{t.today.exercisesCount(p.exercisesTotal)}</span>
                  </div>
                </>
              )}
              <Link
                href={`/workout/${p.todayDay!.id}`}
                style={{
                  display: "block",
                  textAlign: "center",
                  width: "100%",
                  marginTop: 16,
                  padding: 15,
                  borderRadius: 12,
                  background: "var(--blue)",
                  color: "#fff",
                  fontSize: 15,
                  fontWeight: 700,
                  letterSpacing: "-0.01em",
                  transition: "transform .16s cubic-bezier(.4,0,.2,1), filter .16s ease",
                }}
              >
                {inProgress ? t.today.resume : t.today.start}
              </Link>
            </div>
          </div>
        )}

        {/* Week strip */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--ink-faint)", margin: "0 2px 10px" }}>
            {t.today.thisWeek}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 4 }}>
            {order.map((i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flex: 1 }}>
                <span style={{ fontSize: 12, fontWeight: i === p.todayIdx ? 700 : 600, color: i === p.todayIdx ? "var(--blue)" : p.weekTiles[i] === "missed" ? "var(--amber)" : "var(--ink-faint)", opacity: p.weekTiles[i] === "missed" ? 0.7 : 1 }}>
                  {t.today.weekLetters[i]}
                </span>
                <WeekTile state={p.weekTiles[i]} dayNum={p.weekDayNumbers[i]} />
              </div>
            ))}
          </div>
        </div>

        {/* Friends ticker */}
        <div style={{ ...card(), padding: 0, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px 10px" }}>
            <span style={{ fontSize: 15, fontWeight: 700 }}>{t.today.friends}</span>
            <Link href="/friends" style={{ fontSize: 14, fontWeight: 600, color: "var(--blue)" }}>
              {t.today.seeAll}
            </Link>
          </div>
          {p.feed.length === 0 ? (
            <div style={{ padding: "6px 16px 16px", fontSize: 13.5, fontWeight: 500, color: "var(--ink-faint)" }}>
              {t.today.noActivity}
            </div>
          ) : (
            p.feed.map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 16px", borderTop: "1px solid var(--hairline)" }}>
                <div style={{ flex: "none", width: 38, height: 38, borderRadius: 999, background: "rgba(61,139,253,0.18)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "var(--blue)" }}>
                  {f.name.slice(0, 1).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.01em" }}>{f.name}</div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-dim)", marginTop: 1 }}>{f.text}</div>
                </div>
                <span style={{ flex: "none", fontSize: 12.5, fontWeight: 500, color: "var(--ink-faint)" }}>{f.when}</span>
              </div>
            ))
          )}
        </div>

        {/* Next badge teaser */}
        {p.badgeTeaser && (
          <Link href="/badges" style={{ ...card(), display: "block", color: "var(--ink)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
              <div style={{ flex: "none", width: 44, height: 44, borderRadius: 12, background: "rgba(255,159,10,0.14)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width={24} height={24} viewBox="0 0 24 24">
                  <path d="M12 3l6 2.6v5.2c0 3.7-2.6 6.4-6 7.9-3.4-1.5-6-4.2-6-7.9V5.6L12 3Z" fill="var(--amber)" opacity={0.9} />
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.01em" }}>{p.badgeTeaser.name}</div>
                <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-dim)", marginTop: 1, fontVariantNumeric: "tabular-nums" }}>
                  {t.today.workoutsToGo(p.badgeTeaser.toGo)}
                </div>
              </div>
            </div>
            <div style={{ height: 6, borderRadius: 999, background: "var(--hairline)", marginTop: 14, overflow: "hidden" }}>
              <div style={{ width: `${Math.round(p.badgeTeaser.frac * 100)}%`, height: "100%", borderRadius: 999, background: "var(--amber)" }} />
            </div>
          </Link>
        )}
      </div>
    </main>
  );
}

function WeekTile({ state, dayNum }: { state: WeekTileState; dayNum: number }) {
  const base: React.CSSProperties = { width: 40, height: 40, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontVariantNumeric: "tabular-nums" };
  switch (state) {
    case "completed":
      return (
        <div style={{ ...base, background: "rgba(48,209,88,0.15)" }}>
          <Check size={18} />
        </div>
      );
    case "today":
      return (
        <div style={{ position: "relative", width: 40, height: 40 }}>
          <div style={{ position: "absolute", inset: 0, borderRadius: 999, border: "1.5px solid var(--blue)", animation: "pulseRing 2.2s ease-out infinite" }} />
          <div style={{ ...base, position: "absolute", inset: 0, border: "2px solid var(--blue)", fontWeight: 800, color: "var(--blue)" }}>{dayNum}</div>
        </div>
      );
    case "rest":
      return (
        <div style={{ ...base, background: "rgba(255,255,255,0.03)", opacity: 0.55 }}>
          <svg width={17} height={17} viewBox="0 0 24 24">
            <path d="M21 12.9A8.5 8.5 0 1 1 11.1 3.2 6.6 6.6 0 0 0 21 12.9Z" fill="var(--ink-faint)" />
          </svg>
        </div>
      );
    case "missed":
      return <div style={{ ...base, border: "1.5px solid rgba(255,159,10,0.35)", fontWeight: 700, color: "var(--amber)", opacity: 0.75 }}>{dayNum}</div>;
    default:
      return <div style={{ ...base, border: "1.5px solid var(--hairline)", fontWeight: 600, color: "var(--ink-dim)" }}>{dayNum}</div>;
  }
}

function Check({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path d="M5 12.5l4.2 4.2L19 7" stroke="var(--green)" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

function card(): React.CSSProperties {
  return { background: "var(--card)", border: "1px solid var(--card-border)", borderRadius: 16, padding: 18 };
}
