"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { flushSync } from "react-dom";
import { Sheet } from "@/components/Sheet";
import { useI18n } from "@/lib/i18n/client";
import { saveSession, swapExercise } from "@/app/sessions/[dayId]/actions";

export interface EditorExercise {
  id: string;
  exerciseId: string;
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

export interface SwapOption {
  exerciseId: string;
  name: string;
  muscles: string[];
}

interface Props {
  dayId: string;
  dayName: string;
  title: string;
  usualMinutes: number;
  initialExercises: EditorExercise[];
  warmupOptions: SwapOption[];
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

// Long-press-then-drag reordering (FD §4). Pointer events only: hold a row
// ~400ms to lift it (scale + shadow, scroll locked), drag tracks the finger
// with direct transforms (no per-frame React work), siblings slide out of the
// way, release settles into the slot and marks the session dirty.
const LIFT_MS = 400;
const MOVE_TOLERANCE = 8;
const SETTLE = "transform .25s cubic-bezier(.2,.7,.3,1)";

interface DragState {
  id: string;
  ids: string[];
  from: number;
  to: number;
  startY: number;
  tops: number[];
  heights: number[];
}

export function SessionEditorScreen({ dayId, dayName, title: initialTitle, usualMinutes, initialExercises, warmupOptions }: Props) {
  const router = useRouter();
  const { t } = useI18n();
  const [title, setTitle] = useState(initialTitle);
  const [items, setItems] = useState(initialExercises);
  const [removed, setRemoved] = useState<string[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [swapOpen, setSwapOpen] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [pending, startTransition] = useTransition();
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const rowEls = useRef(new Map<string, HTMLButtonElement>());
  const dragRef = useRef<DragState | null>(null);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressStart = useRef<{ id: string; x: number; y: number } | null>(null);
  const suppressClick = useRef(false);

  const open = items.find((i) => i.id === openId) ?? null;
  const minutes = useMemo(() => estimate(items), [items]);

  const patch = (id: string, p: Partial<EditorExercise>) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...p } : i)));
    setDirty(true);
  };

  const cancelPress = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
    pressStart.current = null;
  };

  // Refs so the document-level listeners are stable identities we can always
  // detach, with no stale closures over `items` (the drag snapshot lives in
  // dragRef).
  const blockTouch = useRef((e: TouchEvent) => e.preventDefault());

  const onDragMove = useRef((e: PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const el = rowEls.current.get(d.id);
    if (!el) return;
    const dy = e.clientY - d.startY;
    el.style.transition = "";
    el.style.transform = `translateY(${dy}px) scale(1.03)`;

    const center = d.tops[d.from] + d.heights[d.from] / 2 + dy;
    let to = 0;
    for (let i = 0; i < d.ids.length; i++) {
      if (i === d.from) continue;
      if (center > d.tops[i] + d.heights[i] / 2) to++;
    }
    if (to === d.to) return;
    d.to = to;
    d.ids.forEach((id, i) => {
      if (id === d.id) return;
      const row = rowEls.current.get(id);
      if (!row) return;
      let shift = 0;
      if (i > d.from && i <= d.to) shift = -d.heights[d.from];
      else if (i < d.from && i >= d.to) shift = d.heights[d.from];
      row.style.transition = SETTLE;
      row.style.transform = shift ? `translateY(${shift}px)` : "";
    });
  });

  const onDrop = useRef((_e: PointerEvent) => {});

  const detachDragListeners = () => {
    document.removeEventListener("touchmove", blockTouch.current);
    document.removeEventListener("pointermove", onDragMove.current);
    document.removeEventListener("pointerup", onDrop.current);
    document.removeEventListener("pointercancel", onDrop.current);
    document.body.style.userSelect = "";
  };

  onDrop.current = () => {
    const d = dragRef.current;
    if (!d) return;
    dragRef.current = null;
    detachDragListeners();

    // Glide the lifted row into its slot, then commit the new order and strip
    // every inline transform in the same paint so nothing jumps.
    let targetY = 0;
    if (d.to > d.from) for (let i = d.from + 1; i <= d.to; i++) targetY += d.heights[i];
    else for (let i = d.to; i < d.from; i++) targetY -= d.heights[i];
    const el = rowEls.current.get(d.id);
    if (el) {
      el.style.transition = SETTLE;
      el.style.transform = `translateY(${targetY}px) scale(1)`;
    }
    window.setTimeout(() => {
      for (const row of rowEls.current.values()) {
        row.style.transition = "";
        row.style.transform = "";
      }
      flushSync(() => {
        setDraggingId(null);
        if (d.to !== d.from) {
          setItems((prev) => {
            const next = [...prev];
            const [moved] = next.splice(d.from, 1);
            next.splice(d.to, 0, moved);
            return next;
          });
          setDirty(true);
        }
      });
    }, 260);
  };

  const lift = (id: string) => {
    pressTimer.current = null;
    const start = pressStart.current;
    if (!start || start.id !== id) return;
    const ids = items.map((i) => i.id);
    const from = ids.indexOf(id);
    if (from < 0) return;
    const tops: number[] = [];
    const heights: number[] = [];
    for (const rowId of ids) {
      const el = rowEls.current.get(rowId);
      tops.push(el?.offsetTop ?? 0);
      heights.push(el?.offsetHeight ?? 0);
    }
    dragRef.current = { id, ids, from, to: from, startY: start.y, tops, heights };
    suppressClick.current = true;
    setDraggingId(id);
    const el = rowEls.current.get(id);
    if (el) {
      el.style.transition = "transform .18s ease";
      el.style.transform = "scale(1.03)";
    }
    try {
      navigator.vibrate?.(8);
    } catch {
      // haptics are best-effort
    }
    document.addEventListener("touchmove", blockTouch.current, { passive: false });
    document.addEventListener("pointermove", onDragMove.current);
    document.addEventListener("pointerup", onDrop.current);
    document.addEventListener("pointercancel", onDrop.current);
    document.body.style.userSelect = "none";
  };

  useEffect(() => detachDragListeners, []);

  const onRowPointerDown = (id: string) => (e: React.PointerEvent) => {
    if (pending || dragRef.current) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    suppressClick.current = false;
    cancelPress();
    pressStart.current = { id, x: e.clientX, y: e.clientY };
    pressTimer.current = setTimeout(() => lift(id), LIFT_MS);
  };

  const onRowPointerMove = (e: React.PointerEvent) => {
    if (dragRef.current || !pressStart.current) return;
    const dx = e.clientX - pressStart.current.x;
    const dy = e.clientY - pressStart.current.y;
    if (dx * dx + dy * dy > MOVE_TOLERANCE * MOVE_TOLERANCE) cancelPress();
  };

  // Swap the warm-up in place. Persisted immediately (it's a whole-row change,
  // not a dose tweak), then reflected locally.
  const doSwap = (row: EditorExercise, opt: SwapOption) => {
    setItems((prev) => prev.map((i) => (i.id === row.id ? { ...i, exerciseId: opt.exerciseId, name: opt.name, muscles: opt.muscles, warns: false } : i)));
    setSwapOpen(false);
    startTransition(() => swapExercise(row.id, opt.exerciseId));
  };

  const save = () =>
    startTransition(async () => {
      await saveSession(
        dayId,
        title,
        items.map((i, idx) => ({ id: i.id, order_index: idx, sets: i.sets, reps_min: i.repsMin, reps_max: i.repsMax, seconds: i.seconds, rest_seconds: i.restSeconds })),
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
          {t.tabs.plan}
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
          {dirty && <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--blue)", flexShrink: 0 }}>{t.common.edited}</span>}
        </div>
        <div style={{ fontSize: 15, fontWeight: 500, color: "var(--ink-dim)", marginTop: 3 }}>
          {dayName} · <span style={{ fontVariantNumeric: "tabular-nums" }}>{t.common.minutes(minutes)}</span>
        </div>
        {minutes > usualMinutes + 10 && (
          <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--amber)", marginTop: 4 }}>
            {t.editor.longerThanUsual(minutes, usualMinutes)}
          </div>
        )}
      </div>

      <div style={{ padding: "4px 16px 0", flex: 1 }}>
        <div style={{ background: "var(--card)", border: "1px solid var(--card-border)", borderRadius: 16 }}>
          {items.map((e, i) => (
            <button
              key={e.id}
              ref={(el) => {
                if (el) rowEls.current.set(e.id, el);
                else rowEls.current.delete(e.id);
              }}
              onClick={() => {
                if (suppressClick.current) {
                  suppressClick.current = false;
                  return;
                }
                setOpenId(e.id);
              }}
              onPointerDown={onRowPointerDown(e.id)}
              onPointerMove={onRowPointerMove}
              onPointerUp={() => {
                if (!dragRef.current) cancelPress();
              }}
              onPointerCancel={() => {
                if (!dragRef.current) cancelPress();
              }}
              onContextMenu={(ev) => ev.preventDefault()}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                width: "100%",
                textAlign: "left",
                padding: "14px 16px",
                borderTop: i === 0 || draggingId === e.id ? "none" : "1px solid var(--hairline)",
                opacity: e.isWarmup || e.isCooldown ? 0.7 : 1,
                touchAction: "pan-y",
                userSelect: "none",
                WebkitUserSelect: "none",
                WebkitTouchCallout: "none",
                ...(draggingId === e.id
                  ? {
                      position: "relative" as const,
                      zIndex: 10,
                      background: "#1d242e",
                      borderRadius: 12,
                      boxShadow: "0 10px 28px rgba(0,0,0,0.5)",
                      opacity: 1,
                    }
                  : null),
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
                  {e.isWarmup ? t.editor.warmupPrefix : e.isCooldown ? t.editor.cooldownPrefix : ""}
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
          {t.editor.addExercise}
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
          {pending ? t.common.saving : t.common.save}
        </button>
      </div>

      {/* Dose sheet */}
      <Sheet open={!!open} onClose={() => setOpenId(null)} title={open?.name}>
        {open && (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <StepperRow label={t.editor.sets} value={open.sets} onChange={(v) => patch(open.id, { sets: Math.max(1, Math.min(8, v)) })} />
            {open.doseType === "reps" ? (
              <StepperRow
                label={t.editor.reps}
                display={`${open.repsMin}–${open.repsMax}`}
                value={open.repsMax ?? 10}
                onChange={(v) => {
                  const max = Math.max(3, Math.min(30, v));
                  patch(open.id, { repsMax: max, repsMin: Math.max(1, max - 3) });
                }}
              />
            ) : (
              <StepperRow label={t.editor.seconds} value={open.seconds ?? 30} step={5} onChange={(v) => patch(open.id, { seconds: Math.max(10, Math.min(180, v)) })} />
            )}
            <StepperRow label={t.editor.restBetweenSets} display={`${open.restSeconds}s`} value={open.restSeconds} step={15} onChange={(v) => patch(open.id, { restSeconds: Math.max(0, Math.min(300, v)) })} />
            {open.isWarmup && warmupOptions.length > 1 && (
              <button
                onClick={() => setSwapOpen(true)}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: 14, borderRadius: 12, background: "rgba(255,159,10,0.14)", color: "var(--amber)", fontSize: 15, fontWeight: 700 }}
              >
                <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 3l4 4-4 4M20 7H8M8 21l-4-4 4-4M4 17h12" />
                </svg>
                {t.editor.swapWarmup}
              </button>
            )}
            <button
              onClick={() => {
                setItems((prev) => prev.filter((i) => i.id !== open.id));
                setRemoved((prev) => [...prev, open.id]);
                setDirty(true);
                setOpenId(null);
              }}
              style={{ width: "100%", padding: 14, borderRadius: 12, background: "rgba(255,69,58,0.14)", color: "var(--red)", fontSize: 15, fontWeight: 700 }}
            >
              {t.common.remove}
            </button>
          </div>
        )}
      </Sheet>

      {/* Warm-up swap picker */}
      <Sheet open={swapOpen} onClose={() => setSwapOpen(false)} title={t.editor.swapWarmup}>
        {open && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: "60vh", overflowY: "auto" }}>
            {warmupOptions
              .filter((o) => o.exerciseId !== open.exerciseId)
              .map((o) => (
                <button
                  key={o.exerciseId}
                  onClick={() => doSwap(open, o)}
                  style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left", padding: "12px 14px", borderRadius: 12, background: "var(--fill-resting)" }}
                >
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(255,159,10,0.14)", color: "var(--amber)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                    {o.name.slice(0, 1)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em" }}>{o.name}</div>
                    <div style={{ fontSize: 12.5, fontWeight: 500, color: "var(--ink-dim)" }}>
                      {o.muscles.filter((m) => m !== "Warmup").slice(0, 2).join(" · ")}
                    </div>
                  </div>
                </button>
              ))}
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
