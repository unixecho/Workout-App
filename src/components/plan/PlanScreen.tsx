"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import type { PlanDay } from "@/lib/data";
import { convertToRestDay, regenerateWeek } from "@/app/(tabs)/plan/actions";
import { Sheet } from "@/components/Sheet";

const DAY_LABELS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

interface Props {
  planName: string;
  days: PlanDay[];
  todayIdx: number;
  completedDayIds: string[];
}

export function PlanScreen({ planName, days, todayIdx, completedDayIds }: Props) {
  const [menuDay, setMenuDay] = useState<PlanDay | null>(null);
  const [confirmRegen, setConfirmRegen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <main style={{ minHeight: "100%", paddingBottom: 24 }}>
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
          <div style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.02em", color: "var(--blue)" }}>This week</div>
          <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.08, marginTop: 3 }}>{planName}</div>
        </div>
        <Link
          href="/library"
          aria-label="Exercise Library"
          style={{ flex: "none", width: 36, height: 36, borderRadius: 999, background: "var(--fill-resting)", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 6 }}
        >
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="var(--ink)" strokeWidth={2} strokeLinecap="round">
            <path d="M7 8v8M17 8v8M4 10v4M20 10v4M7 12h10" />
          </svg>
        </Link>
      </div>

      <div style={{ padding: "4px 18px 0", display: "flex", flexDirection: "column", gap: 10 }}>
        {days.map((d) => {
          const isToday = d.day_of_week === todayIdx;
          const isDone = completedDayIds.includes(d.id);
          const inner = (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                background: "var(--card)",
                border: `1px solid ${isToday ? "rgba(61,139,253,0.45)" : "var(--card-border)"}`,
                borderRadius: 16,
                padding: "14px 16px",
                opacity: d.is_rest_day ? 0.7 : 1,
                position: "relative",
              }}
            >
              <div style={{ width: 44, flexShrink: 0, textAlign: "center" }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.02em", color: isToday ? "var(--blue)" : d.is_rest_day ? "var(--ink-faint)" : "var(--ink-dim)" }}>
                  {DAY_LABELS[d.day_of_week]}
                </div>
              </div>
              <div style={{ width: 1, alignSelf: "stretch", background: "var(--hairline)" }} />
              {d.is_rest_day ? (
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10 }}>
                  <svg width={17} height={17} viewBox="0 0 24 24">
                    <path d="M21 12.9A8.5 8.5 0 1 1 11.1 3.2 6.6 6.6 0 0 0 21 12.9Z" fill="var(--ink-faint)" />
                  </svg>
                  <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.01em", color: "var(--ink-dim)" }}>Rest day</div>
                </div>
              ) : (
                <>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.01em" }}>{d.session_title}</div>
                    <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                      {d.focus_muscles.map((m) => (
                        <span key={m} style={{ fontSize: 11.5, fontWeight: 600, padding: "3px 9px", borderRadius: 999, background: "rgba(61,139,253,0.14)", color: "var(--blue)" }}>
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink-dim)", flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>
                    {d.est_duration_min} min
                  </div>
                </>
              )}
              {isDone && (
                <div style={{ position: "absolute", top: -6, right: -6, width: 22, height: 22, borderRadius: 999, background: "var(--green)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width={13} height={13} viewBox="0 0 24 24">
                    <path d="M5 12.5l4.2 4.2L19 7" stroke="#0A0D12" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                </div>
              )}
              <button
                aria-label="Day options"
                onClick={(e) => {
                  e.preventDefault();
                  setMenuDay(d);
                }}
                style={{ flex: "none", width: 30, height: 30, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-faint)", fontSize: 17 }}
              >
                ⋯
              </button>
            </div>
          );
          return d.is_rest_day || isDone ? (
            <div key={d.id}>{inner}</div>
          ) : (
            <Link key={d.id} href={`/sessions/${d.id}`} style={{ color: "var(--ink)" }}>
              {inner}
            </Link>
          );
        })}

        <button
          onClick={() => setConfirmRegen(true)}
          style={{ width: "100%", marginTop: 8, padding: 14, borderRadius: 12, background: "var(--fill-resting)", color: "var(--ink)", fontSize: 15, fontWeight: 700, transition: "transform .15s ease, background .15s ease" }}
        >
          Regenerate week
        </button>
      </div>

      {/* ⋯ sheet */}
      <Sheet open={!!menuDay} onClose={() => setMenuDay(null)} title={menuDay ? DAY_LABELS[menuDay.day_of_week] : ""}>
        {menuDay && !menuDay.is_rest_day && (
          <button
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await convertToRestDay(menuDay.id);
                setMenuDay(null);
              })
            }
            style={sheetRow()}
          >
            Convert to rest day
          </button>
        )}
        {menuDay && !menuDay.is_rest_day && (
          <Link href={`/sessions/${menuDay.id}`} style={{ ...sheetRow(), display: "block", textAlign: "left" }}>
            Edit session
          </Link>
        )}
        {menuDay?.is_rest_day && (
          <div style={{ padding: "14px 4px", fontSize: 14, color: "var(--ink-dim)" }}>
            Rest day — use &ldquo;Regenerate week&rdquo; to reshuffle sessions.
          </div>
        )}
      </Sheet>

      {/* Regenerate confirm */}
      <Sheet open={confirmRegen} onClose={() => setConfirmRegen(false)} title="Regenerate this week?">
        <div style={{ fontSize: 14, lineHeight: 1.5, color: "var(--ink-dim)", padding: "0 4px 14px" }}>
          Replaces this week&rsquo;s remaining days. Completed days are kept.
        </div>
        <button
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await regenerateWeek();
              setConfirmRegen(false);
            })
          }
          style={{ width: "100%", padding: 14, borderRadius: 12, background: "rgba(255,69,58,0.14)", color: "var(--red)", fontSize: 15, fontWeight: 700 }}
        >
          {pending ? "Regenerating…" : "Regenerate"}
        </button>
        <button onClick={() => setConfirmRegen(false)} style={{ width: "100%", padding: 14, borderRadius: 12, background: "var(--fill-resting)", color: "var(--ink)", fontSize: 15, fontWeight: 700, marginTop: 8 }}>
          Cancel
        </button>
      </Sheet>
    </main>
  );
}

function sheetRow(): React.CSSProperties {
  return { width: "100%", textAlign: "left", padding: "14px 4px", fontSize: 16, fontWeight: 600, color: "var(--ink)", borderBottom: "1px solid var(--hairline)" };
}
