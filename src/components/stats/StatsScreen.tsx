"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ProgressRing } from "@/components/ProgressRing";
import { Sheet } from "@/components/Sheet";
import { addWeighIn } from "@/app/(tabs)/stats/actions";

interface Props {
  streak: number;
  longest: number;
  freezes: number;
  weekDone: number;
  weekPlanned: number;
  consistency: number[];
  weighIns: { kg: number; at: string }[];
  currentWeightKg: number | null;
  targetWeightKg: number | null;
  totals: { workouts: number; minutes: number; reps: number };
  balance: [string, number][];
  prs: Array<{ name: string; weight: number }>;
  progression: Array<{ slug: string; name: string; points: { at: string; weight: number }[] }>;
  badges: { earned: number; total: number };
  history: { title: string; date: string; minutes: number }[];
}

export function StatsScreen(p: Props) {
  const [weighOpen, setWeighOpen] = useState(false);
  const [weight, setWeight] = useState(p.currentWeightKg ? String(p.currentWeightKg) : "");
  const [pending, startTransition] = useTransition();

  const maxWeek = Math.max(1, ...p.consistency);
  const maxBalance = Math.max(1, ...p.balance.map(([, v]) => v));

  return (
    <main style={{ minHeight: "100%", paddingBottom: 24 }}>
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          padding: "calc(var(--safe-top) + 14px) 20px 16px",
          background: "linear-gradient(to bottom, rgba(10,13,18,0.96) 55%, rgba(10,13,18,0))",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.02em", color: "var(--blue)" }}>Your progress</div>
        <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.1, marginTop: 2 }}>Stats</div>
      </div>

      <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Streak header */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "4px 4px 2px" }}>
          <div style={{ fontSize: 44, lineHeight: 1, filter: "drop-shadow(0 4px 14px rgba(255,159,10,0.35))" }}>🔥</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontSize: 38, fontWeight: 800, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{p.streak}</span>
              <span style={{ fontSize: 15, fontWeight: 500, color: "var(--ink-dim)" }}>day streak</span>
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink-faint)", marginTop: 4, fontVariantNumeric: "tabular-nums" }}>Longest: {p.longest} days</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 999, background: "rgba(61,139,253,0.14)", color: "var(--blue)", fontSize: 14, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
            <span style={{ fontSize: 15 }}>❄️</span>×{p.freezes}
          </div>
        </div>

        {/* This week */}
        <div style={card({ display: "flex", alignItems: "center", gap: 16 })}>
          <ProgressRing done={p.weekDone} total={Math.max(1, p.weekPlanned)} size={56} />
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
              {p.weekDone}/{p.weekPlanned} sessions this week
            </div>
            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-dim)", marginTop: 2 }}>Keep the rhythm going</div>
          </div>
        </div>

        {/* Consistency */}
        <div style={card()}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Consistency</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 90 }}>
            {p.consistency.map((v, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, height: "100%", justifyContent: "flex-end" }}>
                <div style={{ width: "100%", borderRadius: "6px 6px 2px 2px", background: v > 0 ? "var(--blue)" : "var(--hairline)", height: `${Math.max(4, (v / maxWeek) * 100)}%`, transition: "height .3s ease" }} />
                <span style={{ fontSize: 10.5, fontWeight: 600, color: "var(--ink-faint)" }}>{i === 7 ? "now" : `-${7 - i}w`}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Body weight */}
        <div style={card()}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>Body weight</div>
            <button onClick={() => setWeighOpen(true)} style={{ borderRadius: 999, padding: "8px 14px", fontSize: 13, fontWeight: 700, background: "rgba(61,139,253,0.14)", color: "var(--blue)" }}>
              ＋ Add weigh-in
            </button>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontSize: 32, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{p.currentWeightKg ?? "—"}</span>
            <span style={{ fontSize: 14, fontWeight: 500, color: "var(--ink-dim)" }}>kg</span>
            {p.targetWeightKg && (
              <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--amber)", marginLeft: "auto", fontVariantNumeric: "tabular-nums" }}>goal {p.targetWeightKg} kg</span>
            )}
          </div>
          {p.weighIns.length >= 2 && <WeightSpark data={p.weighIns.map((w) => w.kg)} goal={p.targetWeightKg} />}
        </div>

        {/* Totals */}
        <div style={{ display: "flex", padding: "4px 2px" }}>
          {(
            [
              ["Workouts", p.totals.workouts],
              ["Minutes", p.totals.minutes],
              ["Reps", p.totals.reps],
            ] as const
          ).map(([label, val], i) => (
            <div key={label} style={{ flex: 1, textAlign: "center", borderLeft: i === 0 ? "none" : "1px solid var(--hairline)" }}>
              <div style={{ fontSize: 26, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{val.toLocaleString()}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-faint)", marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Muscle balance */}
        {p.balance.length > 0 && (
          <div style={card()}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Muscle balance</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {p.balance.map(([muscle, sets]) => (
                <div key={muscle} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 78, fontSize: 13, fontWeight: 600, color: "var(--ink-dim)" }}>{muscle}</span>
                  <div style={{ flex: 1, height: 8, borderRadius: 999, background: "var(--hairline)", overflow: "hidden" }}>
                    <div style={{ width: `${(sets / maxBalance) * 100}%`, height: "100%", borderRadius: 999, background: "var(--blue)" }} />
                  </div>
                  <span style={{ width: 26, textAlign: "right", fontSize: 12.5, fontWeight: 600, color: "var(--ink-faint)", fontVariantNumeric: "tabular-nums" }}>{sets}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loading progression */}
        {p.progression.length > 0 && <ProgressionCard series={p.progression} />}

        {/* Personal Records */}
        {p.prs.length > 0 && (
          <div style={card()}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Personal records</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {p.prs.map(({ name, weight }) => (
                <div key={name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13.5, fontWeight: 600 }}>{name}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "var(--blue)", fontVariantNumeric: "tabular-nums" }}>{Math.round(weight)} kg</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Badges row */}
        <Link href="/badges" style={card({ display: "flex", alignItems: "center", gap: 13, color: "var(--ink)" })}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(255,159,10,0.14)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🏅</div>
          <div style={{ flex: 1, fontSize: 16, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
            {p.badges.earned}/{p.badges.total} badges earned
          </div>
          <span style={{ color: "var(--ink-faint)", fontSize: 18 }}>›</span>
        </Link>

        {/* History */}
        <div style={card({ padding: 0, overflow: "hidden" })}>
          <div style={{ padding: "14px 16px 10px", fontSize: 15, fontWeight: 700 }}>History</div>
          {p.history.length === 0 ? (
            <div style={{ padding: "4px 16px 16px", fontSize: 13.5, color: "var(--ink-faint)" }}>Your first workout starts the story.</div>
          ) : (
            p.history.map((h, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderTop: "1px solid var(--hairline)" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{h.title}</div>
                  <div style={{ fontSize: 12.5, fontWeight: 500, color: "var(--ink-faint)", marginTop: 1 }}>{h.date}</div>
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-dim)", fontVariantNumeric: "tabular-nums" }}>{h.minutes} min</span>
              </div>
            ))
          )}
        </div>
      </div>

      <Sheet open={weighOpen} onClose={() => setWeighOpen(false)} title="Add weigh-in">
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--fill-resting)", borderRadius: 12, padding: "14px 16px", marginBottom: 14 }}>
          <input
            inputMode="decimal"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="68.5"
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "var(--ink)", fontSize: 22, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}
          />
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-faint)" }}>kg</span>
        </div>
        <button
          disabled={pending || !parseFloat(weight)}
          onClick={() =>
            startTransition(async () => {
              await addWeighIn(parseFloat(weight));
              setWeighOpen(false);
            })
          }
          style={{ width: "100%", padding: 15, borderRadius: 12, background: "var(--blue)", color: "#fff", fontSize: 15, fontWeight: 700 }}
        >
          {pending ? "Saving…" : "Save"}
        </button>
      </Sheet>
    </main>
  );
}

function ProgressionCard({ series }: { series: Props["progression"] }) {
  const [slug, setSlug] = useState(series[0].slug);
  const active = series.find((s) => s.slug === slug) ?? series[0];
  const pts = active.points;
  const delta = pts[pts.length - 1].weight - pts[0].weight;

  return (
    <div style={card()}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 4 }}>
        <div style={{ fontSize: 15, fontWeight: 700 }}>Loading progression</div>
        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            fontVariantNumeric: "tabular-nums",
            color: delta > 0 ? "var(--green)" : "var(--ink-dim)",
          }}
        >
          {delta > 0 ? "+" : ""}
          {formatKg(delta)} kg
        </span>
      </div>
      <div style={{ fontSize: 12.5, fontWeight: 500, color: "var(--ink-faint)", marginBottom: 12 }}>
        Top set per session
      </div>

      {/* Exercise picker chips */}
      <div style={{ display: "flex", gap: 8, overflowX: "auto", margin: "0 -16px 14px", padding: "0 16px 2px" }}>
        {series.map((s) => {
          const on = s.slug === active.slug;
          return (
            <button
              key={s.slug}
              className="press"
              onClick={() => setSlug(s.slug)}
              style={{
                flexShrink: 0,
                padding: "7px 13px",
                borderRadius: "var(--radius-pill)",
                fontSize: 13,
                fontWeight: 600,
                whiteSpace: "nowrap",
                background: on ? "rgba(61,139,253,0.18)" : "var(--fill-resting)",
                color: on ? "var(--blue)" : "var(--ink-dim)",
                boxShadow: on ? "inset 0 0 0 1px rgba(61,139,253,0.45)" : "none",
                transition: "background .18s ease, color .18s ease, box-shadow .18s ease",
              }}
            >
              {s.name}
            </button>
          );
        })}
      </div>

      <ProgressionChart key={active.slug} points={pts} />

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-faint)" }}>{shortDate(pts[0].at)}</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-faint)", fontVariantNumeric: "tabular-nums" }}>
          {pts.length} sessions
        </span>
        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-faint)" }}>{shortDate(pts[pts.length - 1].at)}</span>
      </div>
    </div>
  );
}

function ProgressionChart({ points }: { points: { at: string; weight: number }[] }) {
  const W = 320;
  const H = 118;
  const PAD_T = 22; // room for the PR label
  const PAD_B = 8;
  const PAD_X = 8;

  const weights = points.map((p) => p.weight);
  const rawMin = Math.min(...weights);
  const rawMax = Math.max(...weights);
  const pad = Math.max(2.5, (rawMax - rawMin) * 0.18);
  const min = rawMin - pad;
  const max = rawMax + pad;

  const x = (i: number) => (points.length === 1 ? W / 2 : PAD_X + (i / (points.length - 1)) * (W - 2 * PAD_X));
  const y = (v: number) => PAD_T + (1 - (v - min) / (max - min)) * (H - PAD_T - PAD_B);

  const prIdx = weights.indexOf(rawMax);
  // Keep the PR label inside the viewBox near the edges
  const prLabelX = Math.min(Math.max(x(prIdx), 34), W - 34);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
      {/* gridlines */}
      {[0.25, 0.55, 0.85].map((f) => (
        <line key={f} x1={0} x2={W} y1={PAD_T + f * (H - PAD_T - PAD_B)} y2={PAD_T + f * (H - PAD_T - PAD_B)} stroke="var(--hairline)" strokeWidth={1} />
      ))}

      {/* area fill under the line */}
      <polygon
        points={`${points.map((p, i) => `${x(i)},${y(p.weight)}`).join(" ")} ${x(points.length - 1)},${H} ${x(0)},${H}`}
        fill="rgba(61,139,253,0.10)"
        style={{ animation: "chart-fade .7s ease .35s backwards" }}
      />

      {/* the line, drawn in */}
      <polyline
        points={points.map((p, i) => `${x(i)},${y(p.weight)}`).join(" ")}
        fill="none"
        stroke="var(--blue)"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={1}
        style={{ animation: "chart-draw .9s var(--ease-structural) forwards" }}
      />

      {/* session dots, staggered in */}
      {points.map((p, i) => (
        <circle
          key={i}
          cx={x(i)}
          cy={y(p.weight)}
          r={i === prIdx ? 4.5 : 3}
          fill={i === prIdx ? "var(--amber)" : "var(--blue)"}
          stroke="var(--card)"
          strokeWidth={1.5}
          style={{
            transformBox: "fill-box",
            transformOrigin: "center",
            animation: `chart-dot .35s var(--ease-structural) ${0.15 + (i / points.length) * 0.7}s backwards`,
          }}
        />
      ))}

      {/* PR label */}
      <text
        x={prLabelX}
        y={y(rawMax) - 10}
        textAnchor="middle"
        fill="var(--amber)"
        style={{ fontSize: 11, fontWeight: 700, fontVariantNumeric: "tabular-nums", animation: "chart-fade .5s ease .75s backwards" }}
      >
        PR {formatKg(rawMax)} kg
      </text>
    </svg>
  );
}

function formatKg(v: number) {
  const rounded = Math.round(v * 2) / 2; // logged weights step in 0.5 kg
  return rounded % 1 === 0 ? String(Math.round(rounded)) : rounded.toFixed(1);
}

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function WeightSpark({ data, goal }: { data: number[]; goal: number | null }) {
  const all = goal ? [...data, goal] : data;
  const min = Math.min(...all) - 1;
  const max = Math.max(...all) + 1;
  const W = 320;
  const H = 70;
  const x = (i: number) => (i / Math.max(1, data.length - 1)) * W;
  const y = (v: number) => H - ((v - min) / (max - min)) * H;
  return (
    <svg viewBox={`0 0 ${W} ${H + 8}`} style={{ width: "100%", height: "auto", marginTop: 12 }}>
      {goal && <line x1={0} x2={W} y1={y(goal)} y2={y(goal)} stroke="var(--amber)" strokeWidth={1.5} strokeDasharray="5 5" opacity={0.7} />}
      <polyline points={data.map((v, i) => `${x(i)},${y(v)}`).join(" ")} fill="none" stroke="var(--blue)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={x(data.length - 1)} cy={y(data[data.length - 1])} r={4} fill="var(--blue)" />
    </svg>
  );
}

function card(extra: React.CSSProperties = {}): React.CSSProperties {
  return { background: "var(--card)", border: "1px solid var(--card-border)", borderRadius: 16, padding: 16, ...extra };
}
