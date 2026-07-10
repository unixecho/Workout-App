"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ExerciseFigure } from "@/components/ExerciseDemo";

export interface LibraryItem {
  id: string;
  slug: string;
  name: string;
  muscles: string[];
  equipment: string;
  difficulty: number;
  pattern: string;
  warns: boolean;
  unsafe: boolean;
}

const FILTERS = ["All", "Warm-up", "Legs", "Push", "Pull", "Core", "Cardio", "Safe for me"];

const FILTER_MUSCLES: Record<string, string[]> = {
  "Warm-up": ["Warmup"],
  Legs: ["Quads", "Glutes", "Hamstrings", "Calves"],
  Push: ["Chest", "Triceps", "Delts"],
  Pull: ["Back", "Biceps"],
  Core: ["Core"],
  Cardio: ["Cardio"],
};

export function LibraryBrowse({ items, pickDayId, userEquipment }: { items: LibraryItem[]; pickDayId: string | null; userEquipment: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");

  const allowed: Record<string, string[]> = {
    none: ["none"],
    park: ["none", "park"],
    basic: ["none", "basic"],
    full_gym: ["none", "park", "basic", "full_gym"],
  };
  const filtered = useMemo(
    () =>
      items.filter((e) => {
        if (query && !e.name.toLowerCase().includes(query.toLowerCase())) return false;
        if (filter === "Safe for me") return !e.unsafe && (allowed[userEquipment] ?? ["none"]).includes(e.equipment);
        if (FILTER_MUSCLES[filter]) return e.muscles.some((m) => FILTER_MUSCLES[filter].includes(m));
        return true;
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, query, filter, userEquipment],
  );

  const href = (e: LibraryItem) => `/library/${e.slug}${pickDayId ? `?pick=${pickDayId}` : ""}`;

  return (
    <main style={{ minHeight: "100dvh", paddingBottom: "calc(var(--safe-bottom) + 24px)" }}>
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          padding: "calc(var(--safe-top) + 10px) 18px 12px",
          background: "linear-gradient(to bottom, rgba(10,13,18,0.96) 60%, rgba(10,13,18,0))",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
        }}
      >
        <button onClick={() => router.back()} style={{ display: "inline-flex", alignItems: "center", gap: 2, padding: "4px 6px 4px 0", marginBottom: 6, color: "var(--blue)", fontSize: 17, fontWeight: 500 }}>
          <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Back
        </button>
        <div style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.02em", color: "var(--blue)" }}>
          {pickDayId ? "Pick an exercise" : "Exercise Library"}
        </div>
        <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-0.02em", marginTop: 2 }}>Browse</div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, background: "rgba(255,255,255,0.08)", borderRadius: 12, padding: "10px 12px" }}>
          <svg width={17} height={17} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
            <circle cx={11} cy={11} r={7} stroke="var(--ink-faint)" strokeWidth={2} />
            <line x1={16.5} y1={16.5} x2={21} y2={21} stroke="var(--ink-faint)" strokeWidth={2} strokeLinecap="round" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search exercises"
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "var(--ink)", fontSize: 16, fontWeight: 500 }}
          />
        </div>

        <div style={{ display: "flex", gap: 8, overflowX: "auto", margin: "12px -18px 0", padding: "0 18px 2px" }}>
          {FILTERS.map((f) => {
            const on = filter === f;
            const safe = f === "Safe for me";
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  flexShrink: 0,
                  padding: "8px 15px",
                  borderRadius: 999,
                  fontSize: 14,
                  fontWeight: 600,
                  letterSpacing: "-0.01em",
                  whiteSpace: "nowrap",
                  background: on ? "rgba(61,139,253,0.18)" : safe ? "rgba(61,139,253,0.10)" : "var(--fill-resting)",
                  color: on || safe ? "var(--blue)" : "var(--ink-dim)",
                  border: `1px solid ${on ? "rgba(61,139,253,0.45)" : "var(--card-border)"}`,
                  transition: "transform .12s ease, background .2s ease",
                }}
              >
                {f}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "8px 16px 0" }}>
        {filtered.map((e) => (
          <Link
            key={e.id}
            href={href(e)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: 12,
              background: "var(--card)",
              border: "1px solid var(--card-border)",
              borderRadius: 16,
              color: "var(--ink)",
              transition: "transform .14s cubic-bezier(.4,0,.2,1)",
            }}
          >
            <div style={{ width: 72, height: 72, flexShrink: 0, borderRadius: 14, background: "rgba(255,255,255,0.04)", position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ExerciseFigure pattern={e.pattern} size={70} animate={false} stroke="var(--ink-dim)" />
              {e.warns && (
                <span style={{ position: "absolute", top: 4, right: 4, width: 16, height: 16, borderRadius: 999, background: "rgba(255,159,10,0.9)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "#0A0D12" }}>
                  !
                </span>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.01em" }}>{e.name}</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {e.muscles.slice(0, 2).map((m) => (
                  <span key={m} style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 999, background: "var(--fill-resting)", color: "var(--ink-dim)" }}>
                    {m}
                  </span>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ display: "flex", gap: 5 }}>
                  {[1, 2, 3].map((d) => (
                    <span key={d} style={{ width: 6, height: 6, borderRadius: 999, background: d <= e.difficulty ? "var(--ink)" : "rgba(255,255,255,0.12)" }} />
                  ))}
                </div>
                <span style={{ width: 1, height: 12, background: "var(--hairline)" }} />
                <span style={{ fontSize: 12.5, fontWeight: 500, color: "var(--ink-faint)", textTransform: "capitalize" }}>
                  {e.equipment === "full_gym" ? "Gym" : e.equipment === "basic" ? "Basic kit" : e.equipment === "park" ? "Park" : "Bodyweight"}
                </span>
              </div>
            </div>
            <span style={{ color: "var(--ink-faint)", fontSize: 18 }}>›</span>
          </Link>
        ))}
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: 40, fontSize: 14, color: "var(--ink-faint)" }}>No matches — try a muscle group.</div>
        )}
      </div>
    </main>
  );
}
