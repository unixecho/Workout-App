"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Sheet } from "@/components/Sheet";
import { saveSession } from "@/app/sessions/[dayId]/actions";

export interface EditorExercise {
  id: string;
  name: string;
  muscles: string[];
  isWarmup: boolean;
  isCooldown: boolean;
  doseType: "reps" | "time";
  sets: number;
  repsMin: number | null;
  repsMax: number | null;
  seconds: number | null;
  restSeconds: number;
  warns: boolean;
}

interface Props {
  dayId: string;
  dayName: string;
  title: string;
  usualMinutes: number;
  initialExercises: EditorExercise[];
}

function doseSummary(e: EditorExercise): string {
  return e.doseType === "time" ? `${e.sets} × ${e.seconds}s` : `${e.sets} × ${e.repsMin}–${e.repsMax}`;
}

function estimate(list: EditorExercise[]): number {
  let secs = 0;
  for (const e of list) {
    const work = e.doseType === "time" ? (e.seconds ?? 30) : (e.repsMax ?? 10) * 3;
    secs += e.sets * work + e.restSeconds * Math.max(0, e.sets - 1) + 40;
  }
  return Math.max(5, Math.round(secs / 60));
}

export function SessionEditorScreen({ dayId, dayName, title: initialTitle, usualMinutes, initialExercises }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [items, setItems] = useState(initialExercises);
  const [removed, setRemoved] = useState<string[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [pending, startTransition] = useTransition();

  const open = items.find((i) => i.id === openId) ?? null;
  const minutes = useMemo(() => estimate(items), [items]);

  const patch = (id: string, p: Partial<EditorExercise>) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...p } : i)));
    setDirty(true);
  };

  const save = () =>
    startTransition(async () => {
      await saveSession(
        dayId,
        title,
        items.map((i) => ({ id: i.id, sets: i.sets, reps_min: i.repsMin, reps_max: i.repsMax, seconds: i.seconds, rest_seconds: i.restSeconds })),
        removed,
      );
      setDirty(false);
      router.push("/plan");
    });

  return (
    <main style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", paddingBottom: "calc(var(--safe-bottom) + 12px)" }}>
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          padding: "calc(var(--safe-top) + 10px) 20px 14px",
          background: "linear-gradient(to bottom, rgba(10,13,18,0.96) 60%, rgba(10,13,18,0))",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
        }}
      >
        <button onClick={() => router.back()} style={{ display: "inline-flex", alignItems: "center", gap: 2, padding: "4px 6px 4px 0", marginBottom: 8, color: "var(--blue)", fontSize: 17, fontWeight: 500 }}>
          <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Plan
        </button>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setDirty(true);
            }}
            style={{ flex: 1, minWidth: 0, background: "transparent", border: "none", outline: "none", color: "var(--ink)", fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", padding: 0 }}
          />
          {dirty && <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--blue)", flexShrink: 0 }}>• Edited</span>}
        </div>
        <div style={{ fontSize: 15, fontWeight: 500, color: "var(--ink-dim)", marginTop: 3 }}>
          {dayName} · <span style={{ fontVariantNumeric: "tabular-nums" }}>~{minutes} min</span>
        </div>
        {minutes > usualMinutes + 10 && (
          <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--amber)", marginTop: 4 }}>
            ~{minutes} min — longer than your usual {usualMinutes}
          </div>
        )}
      </div>

      <div style={{ padding: "4px 16px 0", flex: 1 }}>
        <div style={{ background: "var(--card)", border: "1px solid var(--card-border)", borderRadius: 16, overflow: "hidden" }}>
          {items.map((e, i) => (
            <button
              key={e.id}
              onClick={() => setOpenId(e.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                width: "100%",
                textAlign: "left",
                padding: "14px 16px",
                borderTop: i === 0 ? "none" : "1px solid var(--hairline)",
                opacity: e.isWarmup || e.isCooldown ? 0.7 : 1,
              }}
            >
              <div style={{ width: 34, height: 34, borderRadius: 10, background: e.isWarmup || e.isCooldown ? "rgba(255,159,10,0.14)" : "rgba(61,139,253,0.14)", color: e.isWarmup || e.isCooldown ? "var(--amber)" : "var(--blue)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                {e.name.slice(0, 1)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.01em", display: "flex", alignItems: "center", gap: 6 }}>
                  {e.name}
                  {e.warns && <span style={{ width: 7, height: 7, borderRadius: 999, background: "var(--amber)", flexShrink: 0 }} />}
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 500, color: "var(--ink-dim)", marginTop: 2, fontVariantNumeric: "tabular-nums" }}>
                  {e.isWarmup ? "Warm-up · " : e.isCooldown ? "Cool-down · " : ""}
                  {doseSummary(e)}
                </div>
              </div>
              <span style={{ color: "var(--ink-faint)", fontSize: 18 }}>›</span>
            </button>
          ))}
        </div>

        <Link
          href={`/library?pick=${dayId}`}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 12, padding: 14, borderRadius: 16, border: "1.5px dashed rgba(61,139,253,0.4)", color: "var(--blue)", fontSize: 15, fontWeight: 700 }}
        >
          ＋ Add exercise
        </Link>
      </div>

      <div style={{ padding: "16px 16px 0" }}>
        <button
          onClick={save}
          disabled={!dirty || pending}
          style={{
            width: "100%",
            padding: 15,
            borderRadius: 12,
            fontSize: 15,
            fontWeight: 700,
            background: dirty ? "var(--blue)" : "var(--fill-resting)",
            color: dirty ? "#fff" : "var(--ink-faint)",
            transition: "background .2s ease, color .2s ease, transform .15s ease",
          }}
        >
          {pending ? "Saving…" : "Save"}
        </button>
      </div>

      {/* Dose sheet */}
      <Sheet open={!!open} onClose={() => setOpenId(null)} title={open?.name}>
        {open && (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <StepperRow label="Sets" value={open.sets} onChange={(v) => patch(open.id, { sets: Math.max(1, Math.min(8, v)) })} />
            {open.doseType === "reps" ? (
              <StepperRow
                label="Reps"
                display={`${open.repsMin}–${open.repsMax}`}
                value={open.repsMax ?? 10}
                onChange={(v) => {
                  const max = Math.max(3, Math.min(30, v));
                  patch(open.id, { repsMax: max, repsMin: Math.max(1, max - 3) });
                }}
              />
            ) : (
              <StepperRow label="Seconds" value={open.seconds ?? 30} step={5} onChange={(v) => patch(open.id, { seconds: Math.max(10, Math.min(180, v)) })} />
            )}
            <StepperRow label="Rest between sets" display={`${open.restSeconds}s`} value={open.restSeconds} step={15} onChange={(v) => patch(open.id, { restSeconds: Math.max(0, Math.min(300, v)) })} />
            <button
              onClick={() => {
                setItems((prev) => prev.filter((i) => i.id !== open.id));
                setRemoved((prev) => [...prev, open.id]);
                setDirty(true);
                setOpenId(null);
              }}
              style={{ width: "100%", padding: 14, borderRadius: 12, background: "rgba(255,69,58,0.14)", color: "var(--red)", fontSize: 15, fontWeight: 700 }}
            >
              Remove
            </button>
          </div>
        )}
      </Sheet>
    </main>
  );
}

function StepperRow({
  label,
  value,
  display,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  display?: string;
  step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
      <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.01em" }}>{label}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <RoundBtn label="−" tinted={false} onClick={() => onChange(value - step)} />
        <div style={{ fontSize: 24, fontWeight: 800, fontVariantNumeric: "tabular-nums", minWidth: 56, textAlign: "center" }}>{display ?? value}</div>
        <RoundBtn label="+" tinted onClick={() => onChange(value + step)} />
      </div>
    </div>
  );
}

function RoundBtn({ label, tinted, onClick }: { label: string; tinted: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 44,
        height: 44,
        borderRadius: 999,
        background: tinted ? "rgba(61,139,253,0.18)" : "rgba(255,255,255,0.08)",
        color: tinted ? "var(--blue)" : "var(--ink)",
        fontSize: 22,
        fontWeight: 600,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "transform .15s ease, background .15s ease",
      }}
    >
      {label}
    </button>
  );
}
