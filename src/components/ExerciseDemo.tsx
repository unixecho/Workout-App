"use client";

import { useEffect, useState, type ReactNode } from "react";

/**
 * The single shared exercise-demo component (STYLE.md §5 contract). Every
 * demo is an animated SVG stick figure driven by a movement *pattern* key
 * stored in exercises.demo_keyframes — adding an exercise adds data, never
 * animation code. Timing follows the reference: ease down (0–40%), HOLD at
 * the extreme (40–60%), ease back up (60–100%), ~3.2s per rep.
 */

interface Pose {
  head: [number, number];
  bones: string[]; // polyline points, index-aligned between poses A and B
}

interface Pattern {
  a: Pose;
  b: Pose;
  dur?: string;
  hold?: boolean; // false = continuous motion (cardio), no pause at extremes
}

const STAND_A: Pose = {
  head: [62, 20],
  bones: [
    "62,28 62,56", // torso
    "62,56 62,74", // thigh
    "62,74 62,92", // shin
    "62,92 74,92", // foot
    "62,34 74,46", // arm
  ],
};

const PATTERNS: Record<string, Pattern> = {
  squat: {
    a: STAND_A,
    b: {
      head: [50, 36],
      bones: ["52,44 56,66", "56,66 72,70", "72,70 66,92", "66,92 78,92", "52,48 72,52"],
    },
  },
  lunge: {
    a: STAND_A,
    b: {
      head: [56, 32],
      bones: ["58,40 60,64", "60,64 76,70", "76,70 74,92", "74,92 86,92", "58,44 70,52"],
    },
  },
  hinge: {
    a: STAND_A,
    b: {
      head: [40, 42],
      bones: ["44,50 66,60", "66,60 64,76", "64,76 62,92", "62,92 74,92", "46,52 48,72"],
    },
  },
  push: {
    a: {
      head: [96, 50],
      bones: ["88,54 58,62", "58,62 42,66", "42,66 26,72", "26,72 24,80", "88,54 88,66 90,80"],
    },
    b: {
      head: [96, 62],
      bones: ["88,66 58,70", "58,70 42,73", "42,73 26,77", "26,77 24,84", "88,66 80,74 90,80"],
    },
  },
  row: {
    a: {
      head: [44, 34],
      bones: ["48,42 66,58", "66,58 64,76", "64,76 62,92", "62,92 74,92", "48,44 46,58 44,72"],
    },
    b: {
      head: [44, 34],
      bones: ["48,42 66,58", "66,58 64,76", "64,76 62,92", "62,92 74,92", "48,44 60,52 58,60"],
    },
  },
  press: {
    a: {
      head: [62, 20],
      bones: ["62,28 62,56", "62,56 62,74", "62,74 62,92", "62,92 74,92", "62,32 76,34 76,22"],
    },
    b: {
      head: [62, 20],
      bones: ["62,28 62,56", "62,56 62,74", "62,74 62,92", "62,92 74,92", "62,32 70,20 72,8"],
    },
  },
  bridge: {
    a: {
      head: [22, 86],
      bones: ["30,86 56,86", "56,86 68,72", "68,72 70,90", "70,90 78,90", "34,86 44,86"],
    },
    b: {
      head: [22, 86],
      bones: ["30,86 56,70", "56,70 68,68", "68,68 70,90", "70,90 78,90", "34,86 44,84"],
    },
  },
  hold: {
    a: {
      head: [92, 56],
      bones: ["84,60 56,66", "56,66 40,70", "40,70 26,74", "26,74 24,82", "84,60 84,70 86,80"],
    },
    b: {
      head: [92, 58],
      bones: ["84,62 56,68", "56,68 40,72", "40,72 26,76", "26,76 24,84", "84,62 84,72 86,82"],
    },
    dur: "4s",
  },
  cardio: {
    a: STAND_A,
    b: {
      head: [62, 14],
      bones: ["62,22 62,50", "62,50 62,70", "62,70 62,88", "62,88 74,88", "62,28 76,18"],
    },
    dur: "1.4s",
    hold: false,
  },
};

const KEYTIMES_HOLD = "0;0.4;0.6;1";
const SPLINES_HOLD = ".42 0 .58 1;0 0 1 1;.42 0 .58 1";
const KEYTIMES_FLOW = "0;0.5;1";
const SPLINES_FLOW = ".42 0 .58 1;.42 0 .58 1";

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

export function ExerciseFigure({
  pattern,
  size = 150,
  animate = true,
  stroke = "var(--blue)",
}: {
  pattern: string;
  size?: number;
  animate?: boolean;
  stroke?: string;
}) {
  const reduced = useReducedMotion();
  const p = PATTERNS[pattern] ?? PATTERNS.squat;
  const still = reduced || !animate;
  const hold = p.hold !== false;
  const dur = p.dur ?? "3.2s";
  const keyTimes = hold ? KEYTIMES_HOLD : KEYTIMES_FLOW;
  const splines = hold ? SPLINES_HOLD : SPLINES_FLOW;
  const vals = (a: string, b: string) => (hold ? `${a};${b};${b};${a}` : `${a};${b};${a}`);

  return (
    <svg width={size} height={(size * 100) / 120} viewBox="0 0 120 100" aria-hidden>
      <circle r={6.5} fill={stroke} cx={still ? p.b.head[0] : p.a.head[0]} cy={still ? p.b.head[1] : p.a.head[1]}>
        {!still && (
          <>
            <animate attributeName="cx" values={vals(String(p.a.head[0]), String(p.b.head[0]))} keyTimes={keyTimes} calcMode="spline" keySplines={splines} dur={dur} repeatCount="indefinite" />
            <animate attributeName="cy" values={vals(String(p.a.head[1]), String(p.b.head[1]))} keyTimes={keyTimes} calcMode="spline" keySplines={splines} dur={dur} repeatCount="indefinite" />
          </>
        )}
      </circle>
      {p.a.bones.map((boneA, i) => {
        const boneB = p.b.bones[i];
        return (
          <polyline key={i} points={still ? boneB : boneA} fill="none" stroke={stroke} strokeWidth={6.5} strokeLinecap="round" strokeLinejoin="round">
            {!still && (
              <animate attributeName="points" values={vals(boneA, boneB)} keyTimes={keyTimes} calcMode="spline" keySplines={splines} dur={dur} repeatCount="indefinite" />
            )}
          </polyline>
        );
      })}
    </svg>
  );
}

/** Full stage panel: --bg-elev, radial blue glow, 14px radius, cue caption. */
export function ExerciseDemo({
  pattern,
  caption,
  animate = true,
}: {
  pattern: string;
  caption?: ReactNode;
  animate?: boolean;
}) {
  return (
    <div
      style={{
        background: "radial-gradient(ellipse 70% 60% at 50% 30%, rgba(61,139,253,0.10), transparent 70%), var(--bg-elev)",
        borderRadius: 14,
        padding: "10px 12px 12px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <ExerciseFigure pattern={pattern} animate={animate} />
      {caption && (
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 2 }}>
          <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 4v14M6 12l6 6 6-6" />
          </svg>
          <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-dim)" }}>{caption}</span>
        </div>
      )}
    </div>
  );
}
