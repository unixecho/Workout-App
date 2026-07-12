"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { ExerciseDemo } from "@/components/ExerciseDemo";
import { ProgressRing } from "@/components/ProgressRing";
import { completeWorkout, ensureWorkoutLog, setExerciseLogged } from "@/app/workout/[dayId]/actions";

export interface PlayerExercise {
  id: string;
  exerciseId: string;
  name: string;
  pattern: string;
  formCue: string | null;
  watchFor: string | null;
  adaptation: string | null;
  isWarmup: boolean;
  isCooldown: boolean;
  isOptional: boolean;
  doseType: "reps" | "time";
  sets: number;
  repsMin: number | null;
  repsMax: number | null;
  seconds: number | null;
  done: boolean;
  equipment: string; // for weight input visibility
}

interface Props {
  dayId: string;
  planName: string;
  title: string;
  subtitle: string;
  exercises: PlayerExercise[];
  existingLogId: string | null;
}

const EASE = "cubic-bezier(.4,0,.2,1)";

export function WorkoutPlayer({ dayId, planName, title, subtitle, exercises, existingLogId }: Props) {
  const router = useRouter();
  const [done, setDone] = useState<Set<string>>(new Set(exercises.filter((e) => e.done).map((e) => e.id)));
  const [openId, setOpenId] = useState<string | null>(exercises.find((e) => !e.done)?.id ?? null);
  const [reps, setReps] = useState<Record<string, { rep: number; set: number }>>({});
  const [weights, setWeights] = useState<Record<string, number>>({});
  const [celebrate, setCelebrate] = useState<null | { badges: { name: string; description: string }[]; reps: number; minutes: number; exercises: number }>(null);
  const [, startTransition] = useTransition();
  const logIdRef = useRef<string | null>(existingLogId);
  const startedAtRef = useRef(Date.now());

  const required = exercises.filter((e) => !e.isOptional);
  const doneCount = required.filter((e) => done.has(e.id)).length;

  // ---- Checkpoints: survive refresh / accidental close --------------------
  const storageKey = `repup-checkpoint-${dayId}`;
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const saved = JSON.parse(raw) as { done?: string[]; reps?: Record<string, { rep: number; set: number }>; weights?: Record<string, number> };
      // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage only exists client-side; reading it in the initializer would break SSR hydration
      if (saved.reps) setReps((p) => ({ ...saved.reps, ...p }));
      if (saved.weights) setWeights((p) => ({ ...saved.weights, ...p }));
      if (saved.done?.length) {
        setDone((prev) => {
          const next = new Set(prev);
          for (const id of saved.done!) if (exercises.some((e) => e.id === id)) next.add(id);
          return next;
        });
      }
    } catch {
      /* corrupt checkpoint — ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ done: Array.from(done), reps, weights }));
    } catch {
      /* storage full/unavailable — non-fatal */
    }
  }, [done, reps, weights, storageKey]);

  async function getLogId(): Promise<string> {
    if (!logIdRef.current) logIdRef.current = await ensureWorkoutLog(dayId);
    return logIdRef.current;
  }

  const totalRepsLogged = () =>
    exercises.reduce((acc, e) => {
      if (!done.has(e.id) || e.doseType !== "reps") return acc;
      return acc + e.sets * (e.repsMax ?? 10);
    }, 0);

  function toggleDone(e: PlayerExercise) {
    const marking = !done.has(e.id);
    const next = new Set(done);
    if (marking) next.add(e.id);
    else next.delete(e.id);
    setDone(next); // optimistic

    startTransition(async () => {
      const logId = await getLogId();
      const weight = weights[e.id] ?? undefined;
      const setsCompleted = Array.from({ length: e.sets }, () => {
        const base = e.doseType === "reps" ? { reps: e.repsMax ?? 10 } : { seconds: e.seconds ?? 30 };
        return weight != null ? { ...base, weight } : base;
      });
      await setExerciseLogged(logId, e.exerciseId, marking, setsCompleted);

      const allDone = required.every((r) => (r.id === e.id ? marking : next.has(r.id)));
      if (marking && allDone) {
        const now = new Date();
        const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
        const res = await completeWorkout(logId, localDate, now.getHours(), totalRepsLogged() + (e.doseType === "reps" ? 0 : 0));
        try {
          localStorage.removeItem(storageKey); // workout finished — clear checkpoint
        } catch {}
        setCelebrate({
          badges: res.newBadges,
          reps: totalRepsLogged(),
          minutes: Math.max(1, Math.round((Date.now() - startedAtRef.current) / 60000)),
          exercises: required.length,
        });
      }
    });

    if (marking) {
      // Auto-advance the accordion to the next unfinished row
      const after = exercises.filter((x) => x.id !== e.id && !next.has(x.id));
      setOpenId(after[0]?.id ?? null);
    }
  }

  return (
    <div style={{ minHeight: "100dvh" }}>
      {/* Sticky header */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          padding: "calc(var(--safe-top) + 12px) 20px 18px",
          background: "linear-gradient(180deg, rgba(10,13,18,0.96) 55%, rgba(10,13,18,0.55) 82%, transparent)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <button onClick={() => router.push("/today")} aria-label="Close" style={roundHeaderBtn()}>
            ✕
          </button>
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.02em", textTransform: "uppercase", color: "var(--blue)" }}>{planName}</div>
        <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-0.02em", marginTop: 4 }}>{title}</div>
        <div style={{ fontSize: 15, fontWeight: 500, color: "var(--ink-dim)", marginTop: 2 }}>{subtitle}</div>
      </div>

      <div style={{ padding: "4px 16px calc(var(--safe-bottom) + 44px)" }}>
        {/* Progress block */}
        <div style={{ background: "var(--card)", border: "1px solid var(--card-border)", borderRadius: 16, padding: 16, display: "flex", alignItems: "center", gap: 16 }}>
          <ProgressRing done={doneCount} total={required.length} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.02em", textTransform: "uppercase", color: "var(--blue)" }}>Today&rsquo;s session</div>
            <div style={{ fontSize: 17, fontWeight: 700, marginTop: 3, fontVariantNumeric: "tabular-nums" }}>
              {doneCount} of {required.length} done
            </div>
            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-dim)", marginTop: 2 }}>Keep the tempo controlled</div>
          </div>
        </div>

        {/* Accordion list */}
        <div style={{ background: "var(--card)", border: "1px solid var(--card-border)", borderRadius: 16, overflow: "hidden", marginTop: 16 }}>
          {exercises.map((e, i) => (
            <ExerciseRow
              key={e.id}
              e={e}
              first={i === 0}
              open={openId === e.id}
              isDone={done.has(e.id)}
              repState={reps[e.id] ?? { rep: 0, set: 1 }}
              weight={weights[e.id]}
              onToggleOpen={() => setOpenId(openId === e.id ? null : e.id)}
              onRep={(rep, set) => setReps((p) => ({ ...p, [e.id]: { rep, set } }))}
              onWeight={(w) => setWeights((p) => ({ ...p, [e.id]: w }))}
              onComplete={() => toggleDone(e)}
              onAutoComplete={() => {
                if (!done.has(e.id)) toggleDone(e);
              }}
            />
          ))}
        </div>

        <div style={{ textAlign: "center", fontSize: 12.5, fontWeight: 500, color: "var(--ink-faint)", marginTop: 18, padding: "0 20px" }}>
          Stop any exercise that causes sharp pain. Quality beats quantity.
        </div>
      </div>

      {/* Completion celebration — fades the whole session out to the plan */}
      {celebrate && <Celebration data={celebrate} onDone={() => router.push("/plan")} />}
    </div>
  );
}

function ExerciseRow({
  e,
  first,
  open,
  isDone,
  repState,
  weight,
  onToggleOpen,
  onRep,
  onWeight,
  onComplete,
  onAutoComplete,
}: {
  e: PlayerExercise;
  first: boolean;
  open: boolean;
  isDone: boolean;
  repState: { rep: number; set: number };
  weight: number | undefined;
  onToggleOpen: () => void;
  onRep: (rep: number, set: number) => void;
  onWeight: (w: number) => void;
  onComplete: () => void;
  onAutoComplete: () => void;
}) {
  const meta =
    (e.isWarmup ? "Warm-up · " : e.isCooldown ? "Cool-down · " : "") +
    (e.doseType === "time" ? `${e.sets} × ${e.seconds}s` : `${e.sets} × ${e.repsMin}–${e.repsMax}`) +
    (e.isOptional ? " · optional" : "");

  return (
    <div style={{ borderTop: first ? "none" : "1px solid var(--hairline)" }}>
      <button onClick={onToggleOpen} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left", padding: "14px 16px" }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: isDone ? "rgba(48,209,88,0.16)" : e.isWarmup || e.isCooldown ? "rgba(255,159,10,0.14)" : "rgba(61,139,253,0.14)",
            color: isDone ? "var(--green)" : e.isWarmup || e.isCooldown ? "var(--amber)" : "var(--blue)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {isDone ? "✓" : e.name.slice(0, 1)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.01em", color: isDone ? "var(--ink-dim)" : "var(--ink)" }}>{e.name}</div>
          <div style={{ fontSize: 12.5, fontWeight: 500, color: "var(--ink-dim)", marginTop: 2, fontVariantNumeric: "tabular-nums" }}>{meta}</div>
        </div>
        <span style={{ color: "var(--ink-faint)", fontSize: 18, transition: "transform .3s cubic-bezier(.4,0,.2,1)", transform: open ? "rotate(90deg)" : "none" }}>›</span>
      </button>

      <div style={{ display: "grid", gridTemplateRows: open ? "1fr" : "0fr", transition: `grid-template-rows .35s ${EASE}` }}>
        <div style={{ overflow: "hidden" }}>
          <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 12, opacity: open ? 1 : 0, transition: "opacity .3s ease" }}>
            <ExerciseDemo pattern={e.pattern} animate={open} caption={e.formCue ? undefined : undefined} />
            {e.doseType === "reps" ? (
              <RepTracker sets={e.sets} target={e.repsMax ?? 10} state={repState} isDone={isDone} weight={weight} equipment={e.equipment} onChange={onRep} onWeight={onWeight} onFinishAll={onAutoComplete} />
            ) : (
              <Timer seconds={e.seconds ?? 30} sets={e.sets} state={repState} isDone={isDone} weight={weight} equipment={e.equipment} onChange={onRep} onWeight={onWeight} onFinishAll={onAutoComplete} />
            )}
            {e.formCue && (
              <div style={infoBlock("blue")}>
                <b style={{ color: "var(--blue)" }}>Form — </b>
                {e.formCue}
              </div>
            )}
            {e.watchFor && (
              <div style={infoBlock("amber")}>
                <b style={{ color: "var(--amber)" }}>Watch for — </b>
                {e.watchFor}
              </div>
            )}
            {e.adaptation && (
              <div style={infoBlock("amber")}>
                <b style={{ color: "var(--amber)" }}>For you — </b>
                {e.adaptation}
              </div>
            )}
            <button
              onClick={onComplete}
              style={{
                width: "100%",
                padding: 14,
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 700,
                background: isDone ? "rgba(48,209,88,0.16)" : "var(--fill-resting)",
                color: isDone ? "var(--green)" : "var(--ink)",
                transition: "background .2s ease, color .2s ease, transform .15s ease",
              }}
            >
              {isDone ? "Completed ✓" : "Mark Complete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SetDots({ sets, state, isDone, target }: { sets: number; state: { rep: number; set: number }; isDone: boolean; target?: number }) {
  const dotColor = (i: number) => {
    const n = i + 1;
    // Green: exercise done, a past set, or the current (final) set just hit its target
    if (isDone || n < state.set || (n === state.set && target != null && state.rep >= target)) return "var(--green)";
    if (n === state.set) return "var(--blue)";
    return "var(--ink-faint)";
  };
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {Array.from({ length: sets }, (_, i) => (
        <span key={i} style={{ width: 7, height: 7, borderRadius: 999, background: dotColor(i), transition: "background .2s ease" }} />
      ))}
    </div>
  );
}

function RepTracker({
  sets,
  target,
  state,
  isDone,
  weight,
  equipment,
  onChange,
  onWeight,
  onFinishAll,
}: {
  sets: number;
  target: number;
  state: { rep: number; set: number };
  isDone: boolean;
  weight: number | undefined;
  equipment: string;
  onChange: (rep: number, set: number) => void;
  onWeight: (w: number) => void;
  onFinishAll: () => void;
}) {
  const inc = () => {
    if (state.rep + 1 >= target && state.set >= sets) {
      // Final rep of the final set: light the last dot and complete the exercise
      onChange(target, sets);
      if (state.rep + 1 === target) onFinishAll();
      return;
    }
    if (state.rep + 1 > target) {
      onChange(0, state.set + 1);
    } else onChange(state.rep + 1, state.set);
  };
  const dec = () => {
    if (state.rep === 0) {
      if (state.set > 1) onChange(target, state.set - 1);
    } else onChange(state.rep - 1, state.set);
  };
  return (
    <div style={{ background: "var(--bg-elev)", borderRadius: 14, padding: 14, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <SetDots sets={sets} state={state} isDone={isDone} target={target} />
      <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
        <RoundBtn label="−" tinted={false} onClick={dec} />
        <div style={{ fontSize: 38, fontWeight: 800, fontVariantNumeric: "tabular-nums", minWidth: 96, textAlign: "center" }}>
          {state.rep} <span style={{ color: "var(--ink-faint)", fontSize: 24 }}>/ {target}</span>
        </div>
        <RoundBtn label="+" tinted onClick={inc} />
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-dim)", fontVariantNumeric: "tabular-nums" }}>
        Set {state.set} of {sets}
      </div>
      {equipment !== "none" && (
        <input
          type="number"
          placeholder="Weight (kg)"
          value={weight ?? ""}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            if (!isNaN(val)) onWeight(val);
          }}
          style={{
            width: "100%",
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid var(--card-border)",
            background: "var(--bg)",
            color: "var(--ink)",
            fontSize: 14,
            fontWeight: 500,
            textAlign: "center",
            marginTop: 4,
          }}
        />
      )}
    </div>
  );
}

function Timer({
  seconds,
  sets,
  state,
  isDone,
  weight,
  equipment,
  onChange,
  onWeight,
  onFinishAll,
}: {
  seconds: number;
  sets: number;
  state: { rep: number; set: number };
  isDone: boolean;
  weight: number | undefined;
  equipment: string;
  onChange: (rep: number, set: number) => void;
  onWeight: (w: number) => void;
  onFinishAll: () => void;
}) {
  const [left, setLeft] = useState(seconds);
  const [running, setRunning] = useState(false);
  const endRef = useRef(0);

  useEffect(() => {
    if (!running) return;
    const iv = setInterval(() => {
      const remain = Math.max(0, Math.round((endRef.current - Date.now()) / 1000));
      setLeft(remain);
      if (remain === 0) {
        setRunning(false);
        if (state.set < sets) {
          onChange(0, state.set + 1);
          setLeft(seconds);
        } else {
          // Final set finished: complete the exercise
          onFinishAll();
        }
      }
    }, 250);
    return () => clearInterval(iv);
  }, [running, seconds, sets, state.set, onChange, onFinishAll]);

  return (
    <div style={{ background: "var(--bg-elev)", borderRadius: 14, padding: 14, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      <SetDots sets={sets} state={state} isDone={isDone} />
      <div style={{ fontSize: 38, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{left}s</div>
      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={() => {
            endRef.current = Date.now() + left * 1000;
            setRunning(!running);
          }}
          style={{ borderRadius: 999, padding: "10px 22px", fontSize: 14, fontWeight: 700, background: "rgba(61,139,253,0.14)", color: "var(--blue)" }}
        >
          {running ? "Pause" : "Start"}
        </button>
        <button
          onClick={() => {
            setRunning(false);
            setLeft(seconds);
          }}
          style={{ borderRadius: 999, padding: "10px 22px", fontSize: 14, fontWeight: 700, background: "var(--fill-resting)", color: "var(--ink)" }}
        >
          Reset
        </button>
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-dim)", fontVariantNumeric: "tabular-nums" }}>
        Set {state.set} of {sets}
      </div>
      {equipment !== "none" && (
        <input
          type="number"
          placeholder="Weight (kg)"
          value={weight ?? ""}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            if (!isNaN(val)) onWeight(val);
          }}
          style={{
            width: "100%",
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid var(--card-border)",
            background: "var(--bg)",
            color: "var(--ink)",
            fontSize: 14,
            fontWeight: 500,
            textAlign: "center",
            marginTop: 4,
          }}
        />
      )}
    </div>
  );
}

function Celebration({ data, onDone }: { data: { badges: { name: string; description: string }[]; reps: number; minutes: number; exercises: number }; onDone: () => void }) {
  const [shown, setShown] = useState(false);
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
    return () => cancelAnimationFrame(raf);
  }, []);
  function leave() {
    if (leaving) return;
    setLeaving(true);
    // Let the fade-to-black play, then land on the plan
    setTimeout(onDone, 600);
  }
  return (
    <div
      onClick={leave}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: leaving ? "var(--bg)" : "rgba(10,13,18,0.92)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 28,
        opacity: shown ? 1 : 0,
        transition: "background .55s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
          opacity: leaving ? 0 : shown ? 1 : 0,
          transform: leaving ? "scale(0.96) translateY(-8px)" : "scale(1)",
          transition: "opacity .5s ease, transform .55s cubic-bezier(.4,0,.2,1)",
        }}
      >
      <div style={{ animation: shown ? "burstIn .7s cubic-bezier(.4,0,.2,1) both" : "none" }}>
        <svg width={96} height={96} viewBox="0 0 64 64" style={{ transform: "rotate(-90deg)", filter: "drop-shadow(0 0 22px rgba(48,209,88,.45))" }}>
          <circle cx={32} cy={32} r={28} fill="none" stroke="var(--hairline)" strokeWidth={6} />
          <circle cx={32} cy={32} r={28} fill="none" stroke="var(--green)" strokeWidth={6} strokeLinecap="round" strokeDasharray={176} strokeDashoffset={0} />
        </svg>
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", marginTop: 18 }}>Workout complete 💪</div>
      {/* Summary tiles, staggered in */}
      <div style={{ display: "flex", gap: 10, marginTop: 18, width: "100%", maxWidth: 340 }}>
        {(
          [
            [String(data.exercises), "exercises"],
            [String(data.minutes), "minutes"],
            ...(data.reps > 0 ? ([[String(data.reps), "reps"]] as const) : []),
          ] as const
        ).map(([num, label], i) => (
          <div
            key={label}
            style={{
              flex: 1,
              background: "var(--card)",
              border: "1px solid var(--card-border)",
              borderRadius: 14,
              padding: "12px 8px",
              textAlign: "center",
              opacity: shown ? 1 : 0,
              transform: shown ? "translateY(0)" : "translateY(14px)",
              transition: `opacity .45s ease ${250 + i * 120}ms, transform .5s cubic-bezier(.4,0,.2,1) ${250 + i * 120}ms`,
            }}
          >
            <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>{num}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-dim)", marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 22, width: "100%", maxWidth: 340 }}>
        {data.badges.map((b, i) => (
          <div
            key={b.name}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 13,
              background: "var(--card)",
              border: "1px solid var(--card-border)",
              borderRadius: 16,
              padding: 14,
              opacity: shown ? 1 : 0,
              transform: shown ? "scale(1)" : "scale(0.85)",
              transition: `opacity .45s ease ${400 + i * 150}ms, transform .45s cubic-bezier(.4,0,.2,1) ${400 + i * 150}ms`,
            }}
          >
            <div style={{ width: 44, height: 44, borderRadius: 999, background: "rgba(48,209,88,0.16)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🏅</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{b.name}</div>
              <div style={{ fontSize: 12.5, fontWeight: 500, color: "var(--ink-dim)" }}>{b.description}</div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 800, color: "var(--green)", background: "rgba(48,209,88,0.16)", padding: "3px 8px", borderRadius: 999 }}>New!</span>
          </div>
        ))}
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          leave();
        }}
        style={{ marginTop: 28, width: "100%", maxWidth: 340, padding: 15, borderRadius: 12, background: "var(--blue)", color: "#fff", fontSize: 15, fontWeight: 700 }}
      >
        {leaving ? "" : "Done"}
      </button>
      </div>
      <style>{`@keyframes burstIn { 0% { transform: scale(.55); opacity: 0; } 60% { transform: scale(1.1); opacity: 1; } 100% { transform: scale(1); } }`}</style>
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

function roundHeaderBtn(): React.CSSProperties {
  return {
    width: 36,
    height: 36,
    borderRadius: 999,
    background: "var(--fill-resting)",
    color: "var(--ink)",
    fontSize: 15,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };
}

function infoBlock(tone: "blue" | "amber"): React.CSSProperties {
  return {
    background: tone === "blue" ? "rgba(61,139,253,0.10)" : "rgba(255,159,10,0.10)",
    borderRadius: 12,
    padding: "12px 14px",
    fontSize: 14,
    lineHeight: 1.5,
    color: tone === "blue" ? "var(--blue-pastel)" : "var(--amber-pastel)",
  };
}
