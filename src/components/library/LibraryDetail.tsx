"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { ExerciseDemo } from "@/components/ExerciseDemo";
import { addToSession } from "@/app/library/actions";

interface Props {
  exercise: {
    id: string;
    name: string;
    muscles: string[];
    equipment: string;
    difficulty: number;
    pattern: string;
    formCues: string | null;
    mistakes: string[];
    adaptation: string | null;
  };
  pickDayId: string | null;
}

export function LibraryDetail({ exercise: e, pickDayId }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <main style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", paddingBottom: "calc(var(--safe-bottom) + 16px)" }}>
      <div style={{ padding: "calc(var(--safe-top) + 10px) 20px 0" }}>
        <button onClick={() => router.back()} style={{ display: "inline-flex", alignItems: "center", gap: 2, padding: "4px 6px 4px 0", marginBottom: 8, color: "var(--blue)", fontSize: 17, fontWeight: 500 }}>
          <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Library
        </button>
        <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 14px" }}>{e.name}</h1>

        <ExerciseDemo pattern={e.pattern} caption={e.formCues ? e.formCues.split(";")[0] : undefined} />

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 14, flexWrap: "wrap" }}>
          {e.muscles.map((m) => (
            <span key={m} style={{ fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 999, background: "rgba(61,139,253,0.14)", color: "var(--blue)" }}>
              {m}
            </span>
          ))}
          <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
            {[1, 2, 3].map((d) => (
              <span key={d} style={{ width: 6, height: 6, borderRadius: 999, background: d <= e.difficulty ? "var(--ink)" : "rgba(255,255,255,0.12)" }} />
            ))}
          </div>
          <span style={{ fontSize: 12.5, fontWeight: 500, color: "var(--ink-faint)" }}>
            {e.equipment === "full_gym" ? "Gym" : e.equipment === "basic" ? "Basic kit" : e.equipment === "park" ? "Park" : "Bodyweight"}
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
          {e.formCues && (
            <div style={block("blue")}>
              <b style={{ color: "var(--blue)" }}>Form — </b>
              {e.formCues}
            </div>
          )}
          {e.mistakes.length > 0 && (
            <div style={block("blue")}>
              <b style={{ color: "var(--blue)" }}>Common mistakes</b>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                {e.mistakes.map((m) => (
                  <div key={m} style={{ display: "flex", gap: 8 }}>
                    <span style={{ color: "var(--blue)", flexShrink: 0 }}>•</span>
                    <span>{m}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {e.adaptation && (
            <div style={block("amber")}>
              <b style={{ color: "var(--amber)" }}>For you — </b>
              {e.adaptation}
            </div>
          )}
        </div>
      </div>

      <div style={{ flex: 1 }} />
      {pickDayId && (
        <div style={{ padding: "16px 20px 0" }}>
          <button
            disabled={pending}
            onClick={() => startTransition(() => addToSession(pickDayId, e.id))}
            style={{ width: "100%", padding: 15, borderRadius: 12, background: "var(--blue)", color: "#fff", fontSize: 15, fontWeight: 700 }}
          >
            {pending ? "Adding…" : "Add to session"}
          </button>
        </div>
      )}
    </main>
  );
}

function block(tone: "blue" | "amber"): React.CSSProperties {
  return {
    background: tone === "blue" ? "rgba(61,139,253,0.10)" : "rgba(255,159,10,0.10)",
    borderRadius: 12,
    padding: "12px 14px",
    fontSize: 14,
    lineHeight: 1.5,
    color: tone === "blue" ? "var(--blue-pastel)" : "var(--amber-pastel)",
  };
}
