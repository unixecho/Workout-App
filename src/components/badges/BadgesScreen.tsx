"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Sheet } from "@/components/Sheet";

export interface BadgeTile {
  key: string;
  section: string;
  name: string;
  description: string;
  earnedAt: string | null;
  progress: { current: number; target: number } | null;
  secret: boolean;
}

const SECTION_ORDER = ["streaks", "milestones", "volume", "social", "special"];
const SECTION_LABELS: Record<string, string> = {
  streaks: "Streaks",
  milestones: "Milestones",
  volume: "Volume",
  social: "Social",
  special: "Special",
};
const SECTION_EMOJI: Record<string, string> = {
  streaks: "🔥",
  milestones: "🏆",
  volume: "🏋️",
  social: "🤝",
  special: "✨",
};

export function BadgesScreen({ tiles, earnedCount, totalCount }: { tiles: BadgeTile[]; earnedCount: number; totalCount: number }) {
  const router = useRouter();
  const [openBadge, setOpenBadge] = useState<BadgeTile | null>(null);

  return (
    <main style={{ minHeight: "100dvh", paddingBottom: "calc(var(--safe-bottom) + 40px)" }}>
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          padding: "calc(var(--safe-top) + 10px) 20px 16px",
          background: "linear-gradient(to bottom, rgba(10,13,18,0.96) 60%, rgba(10,13,18,0))",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
        }}
      >
        <button onClick={() => router.back()} style={{ display: "inline-flex", alignItems: "center", gap: 2, padding: "4px 6px 4px 0", marginBottom: 8, color: "var(--blue)", fontSize: 17, fontWeight: 500 }}>
          <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Stats
        </button>
        <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.05 }}>Badges</div>
        <div style={{ fontSize: 15, fontWeight: 500, color: "var(--ink-dim)", marginTop: 4, fontVariantNumeric: "tabular-nums" }}>
          {earnedCount} of {totalCount} earned
        </div>
      </div>

      <div style={{ padding: "0 20px" }}>
        {SECTION_ORDER.map((section) => {
          const inSection = tiles.filter((t) => t.section === section);
          if (!inSection.length) return null;
          return (
            <div key={section} style={{ marginTop: 26 }}>
              <div style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-faint)", margin: "0 2px 14px" }}>
                {SECTION_LABELS[section]}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px 8px" }}>
                {inSection.map((t) => (
                  <button key={t.key} onClick={() => setOpenBadge(t)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                    <div
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: 999,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 26,
                        background: t.earnedAt
                          ? "linear-gradient(135deg, rgba(61,139,253,0.35), rgba(48,209,88,0.3))"
                          : "rgba(255,255,255,0.04)",
                        border: `1px solid ${t.earnedAt ? "rgba(61,139,253,0.4)" : "var(--card-border)"}`,
                        filter: t.earnedAt ? "none" : "grayscale(1)",
                        opacity: t.earnedAt ? 1 : 0.5,
                      }}
                    >
                      {t.secret ? "❔" : SECTION_EMOJI[t.section]}
                    </div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: t.earnedAt ? "var(--ink)" : "var(--ink-dim)", textAlign: "center" }}>{t.name}</div>
                    {t.earnedAt ? (
                      <div style={{ fontSize: 10.5, fontWeight: 500, color: "var(--ink-faint)" }}>{t.earnedAt}</div>
                    ) : t.progress ? (
                      <div style={{ width: "80%", height: 4, borderRadius: 999, background: "var(--card)", overflow: "hidden" }}>
                        <div style={{ width: `${Math.min(100, Math.round((t.progress.current / t.progress.target) * 100))}%`, height: "100%", background: "var(--blue)" }} />
                      </div>
                    ) : null}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <Sheet open={!!openBadge} onClose={() => setOpenBadge(null)}>
        {openBadge && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 10, paddingBottom: 6 }}>
            <div
              style={{
                width: 84,
                height: 84,
                borderRadius: 999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 36,
                background: openBadge.earnedAt ? "linear-gradient(135deg, rgba(61,139,253,0.35), rgba(48,209,88,0.3))" : "rgba(255,255,255,0.05)",
                filter: openBadge.earnedAt ? "none" : "grayscale(1)",
              }}
            >
              {openBadge.secret ? "❔" : SECTION_EMOJI[openBadge.section]}
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em" }}>{openBadge.name}</div>
            <div style={{ fontSize: 14, fontWeight: 500, color: "var(--ink-dim)", lineHeight: 1.5 }}>{openBadge.description}</div>
            {openBadge.earnedAt && <div style={{ fontSize: 13, fontWeight: 600, color: "var(--green)" }}>Earned {openBadge.earnedAt}</div>}
            {openBadge.progress && (
              <div style={{ width: "100%", marginTop: 6 }}>
                <div style={{ height: 6, borderRadius: 999, background: "var(--card)", overflow: "hidden" }}>
                  <div style={{ width: `${Math.min(100, Math.round((openBadge.progress.current / openBadge.progress.target) * 100))}%`, height: "100%", background: "var(--blue)" }} />
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink-faint)", marginTop: 6, fontVariantNumeric: "tabular-nums" }}>
                  {openBadge.progress.current.toLocaleString()}/{openBadge.progress.target.toLocaleString()}
                </div>
              </div>
            )}
          </div>
        )}
      </Sheet>
    </main>
  );
}
