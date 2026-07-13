"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import type { PlanDay } from "@/lib/data";
import { convertToRestDay, regenerateWeek } from "@/app/(tabs)/plan/actions";
import { Sheet } from "@/components/Sheet";
import { useI18n } from "@/lib/i18n/client";
import { weekdayDisplayOrder } from "@/lib/i18n";
import { formatDate } from "@/lib/i18n/format";

interface Props {
  planName: string;
  days: PlanDay[];
  todayIdx: number;
  completedDayIds: string[];
  completedDates: string[]; // completed_at ISO timestamps
}

export function PlanScreen({ planName, days, todayIdx, completedDayIds, completedDates }: Props) {
  const { locale, t } = useI18n();
  const [menuDay, setMenuDay] = useState<PlanDay | null>(null);
  const [confirmRegen, setConfirmRegen] = useState(false);
  const [view, setView] = useState<"week" | "month">("week");
  const [pending, startTransition] = useTransition();

  const dayTitle = (title: string | null) => (title ? (t.content.dayTitles[title] ?? title) : "");
  // Storage stays Monday-first; Hebrew lists the week Sunday-first
  const order = weekdayDisplayOrder(locale);
  const orderedDays = [...days].sort((a, b) => order.indexOf(a.day_of_week) - order.indexOf(b.day_of_week));

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
          <div style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.02em", color: "var(--blue)" }}>
            {view === "week" ? t.plan.thisWeek : t.plan.thisMonth}
          </div>
          <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.08, marginTop: 3 }}>{planName}</div>
        </div>
        <Link
          href="/library"
          aria-label={t.plan.libraryAria}
          style={{ flex: "none", width: 36, height: 36, borderRadius: 999, background: "var(--fill-resting)", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 6 }}
        >
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="var(--ink)" strokeWidth={2} strokeLinecap="round">
            <path d="M7 8v8M17 8v8M4 10v4M20 10v4M7 12h10" />
          </svg>
        </Link>
      </div>

      <div style={{ padding: "0 18px 10px" }}>
        <div style={{ display: "flex", background: "var(--fill-resting)", borderRadius: 10, padding: 2 }}>
          {(["week", "month"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                flex: 1,
                padding: "8px 0",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                background: view === v ? "rgba(61,139,253,0.18)" : "transparent",
                color: view === v ? "var(--blue)" : "var(--ink-dim)",
                transition: "background .2s ease, color .2s ease",
              }}
            >
              {v === "week" ? t.plan.week : t.plan.month}
            </button>
          ))}
        </div>
      </div>

      {view === "month" && <MonthView days={days} completedDates={completedDates} />}

      <div style={{ padding: "4px 18px 0", display: view === "week" ? "flex" : "none", flexDirection: "column", gap: 10 }}>
        {orderedDays.map((d) => {
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
                  {t.plan.dayShort[d.day_of_week]}
                </div>
              </div>
              <div style={{ width: 1, alignSelf: "stretch", background: "var(--hairline)" }} />
              {d.is_rest_day ? (
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10 }}>
                  <svg width={17} height={17} viewBox="0 0 24 24">
                    <path d="M21 12.9A8.5 8.5 0 1 1 11.1 3.2 6.6 6.6 0 0 0 21 12.9Z" fill="var(--ink-faint)" />
                  </svg>
                  <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.01em", color: "var(--ink-dim)" }}>{t.plan.restDay}</div>
                </div>
              ) : (
                <>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.01em" }}>{dayTitle(d.session_title)}</div>
                    <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                      {d.focus_muscles.map((m) => (
                        <span key={m} style={{ fontSize: 11.5, fontWeight: 600, padding: "3px 9px", borderRadius: 999, background: "rgba(61,139,253,0.14)", color: "var(--blue)" }}>
                          {t.content.muscles[m] ?? m}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink-dim)", flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>
                    {t.common.min(d.est_duration_min ?? 45)}
                  </div>
                </>
              )}
              {isDone && (
                <div style={{ position: "absolute", top: -6, insetInlineEnd: -6, width: 22, height: 22, borderRadius: 999, background: "var(--green)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width={13} height={13} viewBox="0 0 24 24">
                    <path d="M5 12.5l4.2 4.2L19 7" stroke="#0A0D12" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                </div>
              )}
              <button
                aria-label={t.plan.dayOptionsAria}
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
          {t.plan.regenerateWeek}
        </button>
      </div>

      {/* ⋯ sheet */}
      <Sheet open={!!menuDay} onClose={() => setMenuDay(null)} title={menuDay ? t.plan.dayShort[menuDay.day_of_week] : ""}>
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
            {t.plan.convertToRest}
          </button>
        )}
        {menuDay && !menuDay.is_rest_day && (
          <Link href={`/sessions/${menuDay.id}`} style={{ ...sheetRow(), display: "block", textAlign: "start" }}>
            {t.plan.editSession}
          </Link>
        )}
        {menuDay?.is_rest_day && (
          <div style={{ padding: "14px 4px", fontSize: 14, color: "var(--ink-dim)" }}>
            {t.plan.restDayNote}
          </div>
        )}
      </Sheet>

      {/* Regenerate confirm */}
      <Sheet open={confirmRegen} onClose={() => setConfirmRegen(false)} title={t.plan.regenTitle}>
        <div style={{ fontSize: 14, lineHeight: 1.5, color: "var(--ink-dim)", padding: "0 4px 14px" }}>
          {t.plan.regenBlurb}
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
          {pending ? t.plan.regenerating : t.plan.regenerate}
        </button>
        <button onClick={() => setConfirmRegen(false)} style={{ width: "100%", padding: 14, borderRadius: 12, background: "var(--fill-resting)", color: "var(--ink)", fontSize: 15, fontWeight: 700, marginTop: 8 }}>
          {t.common.cancel}
        </button>
      </Sheet>
    </main>
  );
}

/** Monday-based weekday index (0=Mon..6=Sun). Kept local: lib/data is server-only. */
function mondayIdx(d: Date): number {
  return (d.getDay() + 6) % 7;
}
function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Month view: projects the weekly template onto a calendar month — every
 * date shows that weekday's planned session, past dates show what was
 * actually completed (green). Tap a non-rest day to open its session.
 */
function MonthView({ days, completedDates }: { days: PlanDay[]; completedDates: string[] }) {
  const router = useRouter();
  const { locale, t } = useI18n();
  const [offset, setOffset] = useState(0);
  // Column order follows the locale's week start (Sunday-first for Hebrew);
  // data stays Monday-indexed and is mapped into columns via this order.
  const order = weekdayDisplayOrder(locale);

  const { monthDate, cells } = useMemo(() => {
    const base = new Date();
    base.setDate(1);
    base.setMonth(base.getMonth() + offset);
    const year = base.getFullYear();
    const month = base.getMonth();
    const lead = order.indexOf(mondayIdx(new Date(year, month, 1)));
    const count = new Date(year, month + 1, 0).getDate();
    const cells: (Date | null)[] = [
      ...Array.from({ length: lead }, () => null),
      ...Array.from({ length: count }, (_, i) => new Date(year, month, i + 1)),
    ];
    while (cells.length % 7 !== 0) cells.push(null);
    return { monthDate: base, cells };
  }, [offset, order]);

  const byWeekday = useMemo(() => new Map(days.map((d) => [d.day_of_week, d])), [days]);
  const doneSet = useMemo(() => new Set(completedDates.map((iso) => ymd(new Date(iso)))), [completedDates]);
  const todayStr = ymd(new Date());

  return (
    <div style={{ padding: "0 18px" }}>
      <div style={{ background: "var(--card)", border: "1px solid var(--card-border)", borderRadius: 16, padding: "14px 12px 10px" }}>
        {/* Month switcher */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 6px 10px" }}>
          <button aria-label={t.plan.prevMonthAria} onClick={() => setOffset((o) => o - 1)} style={monthNavBtn()}>
            <span className="dir-flip" style={{ display: "inline-block" }}>‹</span>
          </button>
          <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em" }}>
            {formatDate(locale, monthDate, { month: "long", year: "numeric" })}
          </div>
          <button aria-label={t.plan.nextMonthAria} onClick={() => setOffset((o) => o + 1)} style={monthNavBtn()}>
            <span className="dir-flip" style={{ display: "inline-block" }}>›</span>
          </button>
        </div>

        {/* Weekday header */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 4 }}>
          {order.map((i) => (
            <div key={i} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: "var(--ink-faint)", padding: "4px 0" }}>
              {t.today.weekLetters[i]}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", rowGap: 2 }}>
          {cells.map((date, i) => {
            if (!date) return <div key={i} />;
            const day = byWeekday.get(mondayIdx(date));
            const planned = !!day && !day.is_rest_day;
            const dateStr = ymd(date);
            const isDone = doneSet.has(dateStr);
            const isToday = dateStr === todayStr;
            return (
              <button
                key={i}
                onClick={() => planned && day && router.push(`/sessions/${day.id}`)}
                aria-label={planned ? `${dateStr}: ${t.content.dayTitles[day?.session_title ?? ""] ?? day?.session_title}` : `${dateStr}: ${t.plan.restDay}`}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 3,
                  padding: "5px 0 6px",
                  borderRadius: 10,
                  background: "transparent",
                  cursor: planned ? "pointer" : "default",
                  transition: "background .15s ease, transform .15s ease",
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 999,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 13.5,
                    fontWeight: isToday ? 800 : 600,
                    fontVariantNumeric: "tabular-nums",
                    background: isDone ? "rgba(48,209,88,0.18)" : isToday ? "rgba(61,139,253,0.18)" : "transparent",
                    color: isDone ? "var(--green)" : isToday ? "var(--blue)" : planned ? "var(--ink)" : "var(--ink-faint)",
                    border: isToday ? "1px solid rgba(61,139,253,0.45)" : "1px solid transparent",
                  }}
                >
                  {date.getDate()}
                </div>
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: 999,
                    background: isDone ? "var(--green)" : planned ? "var(--blue)" : "transparent",
                    opacity: planned && !isDone && dateStr < todayStr ? 0.35 : 1,
                  }}
                />
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div style={{ display: "flex", justifyContent: "center", gap: 16, padding: "10px 0 4px" }}>
          <LegendDot color="var(--blue)" label={t.plan.legendPlanned} />
          <LegendDot color="var(--green)" label={t.plan.legendCompleted} />
        </div>
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "var(--ink-dim)" }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: color }} />
      {label}
    </span>
  );
}

function monthNavBtn(): React.CSSProperties {
  return {
    width: 32,
    height: 32,
    borderRadius: 999,
    background: "var(--fill-resting)",
    color: "var(--ink)",
    fontSize: 18,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };
}

function sheetRow(): React.CSSProperties {
  return { width: "100%", textAlign: "start", padding: "14px 4px", fontSize: 16, fontWeight: 600, color: "var(--ink)", borderBottom: "1px solid var(--hairline)" };
}
