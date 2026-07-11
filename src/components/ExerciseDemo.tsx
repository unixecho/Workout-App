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

  // ---- Precise per-exercise patterns (2026-07 pass) ----------------------
  // Same contract as above: two index-aligned poses, bones are polylines.
  treadmill: {
    // walking gait over a static belt line
    a: { head: [60, 22], bones: ["30,92 94,92", "60,30 60,58", "60,58 72,74 74,90", "60,58 50,74 44,88", "60,36 72,46"] },
    b: { head: [60, 22], bones: ["30,92 94,92", "60,30 60,58", "60,58 52,74 46,90", "60,58 70,74 76,88", "60,36 48,46"] },
    dur: "1.2s",
    hold: false,
  },
  bike: {
    // seated figure, pedaling circle approximated by two crank positions
    a: { head: [48, 32], bones: ["64,78 86,78", "52,40 66,62", "66,62 58,74 68,84", "66,62 74,70 64,68", "54,44 72,56"] },
    b: { head: [48, 32], bones: ["64,78 86,78", "52,40 66,62", "66,62 74,72 64,70", "66,62 58,76 68,86", "54,44 72,56"] },
    dur: "1.3s",
    hold: false,
  },
  jumprope: {
    a: { head: [62, 22], bones: ["62,30 62,56", "62,56 56,74 54,90", "62,56 68,74 70,90", "48,54 62,36 76,54", "40,60 62,58 84,60"] },
    b: { head: [62, 16], bones: ["62,24 62,50", "62,50 56,66 54,82", "62,50 68,66 70,82", "46,48 62,30 78,48", "40,20 62,10 84,20"] },
    dur: "0.9s",
    hold: false,
  },
  highknees: {
    a: { head: [62, 18], bones: ["62,26 62,54", "62,54 74,58 70,70", "62,54 60,74 58,92", "62,32 76,40", "62,32 50,42"] },
    b: { head: [62, 18], bones: ["62,26 62,54", "62,54 64,74 66,92", "62,54 50,58 54,70", "62,32 48,40", "62,32 74,42"] },
    dur: "0.9s",
    hold: false,
  },
  pike: {
    // inverted V, head lowers toward the hands
    a: { head: [40, 58], bones: ["42,64 38,92", "46,66 44,92", "46,60 66,44", "66,44 80,92", "80,92 86,92"] },
    b: { head: [38, 74], bones: ["42,78 38,92", "46,80 44,92", "46,72 66,46", "66,46 80,92", "80,92 86,92"] },
  },
  wallsit: {
    // static hold against a wall line
    a: { head: [76, 34], bones: ["88,20 88,92", "78,42 80,64", "80,64 62,66", "62,66 62,90", "62,90 54,90"] },
    b: { head: [76, 36], bones: ["88,20 88,92", "78,44 80,66", "80,66 62,68", "62,68 62,90", "62,90 54,90"] },
    dur: "4s",
  },
  sideplank: {
    a: { head: [36, 56], bones: ["42,64 42,88", "44,62 66,74 88,86", "44,66 66,78 88,90", "44,60 48,40", "88,86 94,86"] },
    b: { head: [36, 60], bones: ["42,66 42,88", "44,66 66,80 88,88", "44,70 66,84 88,92", "44,64 48,44", "88,88 94,88"] },
    dur: "4s",
  },
  situp: {
    a: { head: [26, 84], bones: ["34,86 58,86", "58,86 70,72", "70,72 74,90", "74,90 82,90", "36,84 46,80"] },
    b: { head: [40, 64], bones: ["46,70 58,86", "58,86 70,72", "70,72 74,90", "74,90 82,90", "48,70 58,66"] },
  },
  burpee: {
    // stand <-> plank sprawl
    a: { head: [62, 20], bones: ["62,28 62,56", "62,56 62,74", "62,74 62,92", "62,92 74,92", "62,34 74,46"] },
    b: { head: [92, 58], bones: ["84,62 56,68", "56,68 40,72", "40,72 26,76", "26,76 24,84", "84,62 86,82"] },
    dur: "2.2s",
  },
  jumpsquat: {
    a: { head: [50, 36], bones: ["52,44 56,66", "56,66 72,70", "72,70 66,92", "66,92 78,92", "52,48 72,52"] },
    b: { head: [62, 10], bones: ["62,18 62,46", "62,46 62,64", "62,64 62,80", "62,80 70,78", "62,24 76,12"] },
    dur: "1.1s",
    hold: false,
  },
  stepup: {
    // static box, figure steps up onto it
    a: { head: [46, 26], bones: ["68,74 92,74 92,92", "46,34 46,60", "46,60 46,76 46,92", "46,60 52,76 56,92", "46,38 56,48"] },
    b: { head: [56, 16], bones: ["68,74 92,74 92,92", "56,24 56,50", "56,50 66,60 70,74", "56,50 50,70 48,88", "56,28 68,38"] },
  },
  pullup: {
    // static bar, dead hang <-> chin over
    a: { head: [62, 28], bones: ["34,10 90,10", "62,36 62,60", "62,60 60,76 58,88", "62,38 52,24 52,10", "62,38 72,24 72,10"] },
    b: { head: [62, 14], bones: ["34,10 90,10", "62,22 62,46", "62,46 58,60 54,70", "62,24 52,17 52,10", "62,24 72,17 72,10"] },
  },
  dip: {
    // parallel bars, support <-> bottom of dip
    a: { head: [62, 20], bones: ["26,42 46,42", "78,42 98,42", "62,28 62,54", "62,54 58,70 54,82", "62,30 48,42"] },
    b: { head: [62, 32], bones: ["26,42 46,42", "78,42 98,42", "62,40 62,64", "62,64 56,78 52,88", "62,42 48,42"] },
  },
  invrow: {
    // body straight under a static bar, heels on the ground
    a: { head: [40, 64], bones: ["30,34 92,34", "46,66 68,76 88,86", "48,64 46,34", "52,66 50,36", "88,86 94,86"] },
    b: { head: [40, 44], bones: ["30,34 92,34", "46,48 68,66 88,86", "48,46 46,34", "52,50 50,36", "88,86 94,86"] },
  },
  kneeraise: {
    // hanging from the bar, knees drive up
    a: { head: [62, 26], bones: ["34,10 90,10", "62,34 62,58", "62,58 61,74 60,88", "62,36 52,23 52,10", "62,36 72,23 72,10"] },
    b: { head: [62, 26], bones: ["34,10 90,10", "62,34 62,58", "62,58 74,62 72,76", "62,36 52,23 52,10", "62,36 72,23 72,10"] },
  },
  deadbug: {
    // on the back: opposite arm/leg reach away and return
    a: { head: [24, 80], bones: ["32,82 56,82", "56,82 58,66", "58,66 70,66", "36,80 36,62", "56,82 50,70"] },
    b: { head: [24, 80], bones: ["32,82 56,82", "56,82 68,72", "68,72 82,74", "36,80 24,68", "56,82 50,70"] },
  },
  birddog: {
    // quadruped: opposite arm/leg extend
    a: { head: [86, 52], bones: ["80,56 52,58", "78,58 78,88", "52,58 46,86", "78,58 72,72", "52,58 58,74"] },
    b: { head: [86, 52], bones: ["80,56 52,58", "78,58 78,88", "52,58 46,86", "78,58 96,50", "52,58 30,52"] },
  },
  superman: {
    // prone on a ground line, arms/legs lift
    a: { head: [26, 84], bones: ["18,92 100,92", "38,86 66,86", "66,86 90,88", "38,86 24,86", "40,88 26,86"] },
    b: { head: [24, 74], bones: ["18,92 100,92", "38,82 66,86", "66,86 90,76", "38,80 22,70", "40,84 24,74"] },
  },
  calfraise: {
    // heels lift, toes stay planted
    a: { head: [62, 20], bones: ["62,28 62,56", "62,56 62,74", "62,74 62,92", "58,92 74,92", "62,34 74,46"] },
    b: { head: [62, 14], bones: ["62,22 62,50", "62,50 62,68", "62,68 62,86", "58,86 74,92", "62,28 74,40"] },
  },
  jumpingjack: {
    a: { head: [62, 18], bones: ["62,26 62,54", "62,54 58,74 56,92", "62,54 66,74 68,92", "50,54 62,34 74,54", "56,58 62,54 68,58"] },
    b: { head: [62, 16], bones: ["62,24 62,52", "62,52 50,72 44,90", "62,52 74,72 80,90", "44,18 62,30 80,18", "54,56 62,52 70,56"] },
    dur: "1s",
    hold: false,
  },
  climber: {
    // plank base, knees drive alternately
    a: { head: [92, 54], bones: ["20,88 96,88", "84,58 60,64", "84,58 84,80", "60,64 72,72 78,80", "60,64 40,72 28,78"] },
    b: { head: [92, 54], bones: ["20,88 96,88", "84,58 60,64", "84,58 84,80", "60,64 42,74 30,80", "60,64 68,72 76,78"] },
    dur: "0.9s",
    hold: false,
  },
  childpose: {
    a: { head: [34, 70], bones: ["16,92 96,92", "36,74 20,80", "40,72 58,64 70,74", "70,74 74,88 60,88", "42,76 26,82"] },
    b: { head: [33, 72], bones: ["16,92 96,92", "35,76 19,82", "39,74 58,66 70,74", "70,74 74,88 60,88", "41,78 25,84"] },
    dur: "4s",
  },
  catcow: {
    // quadruped spine: dip (cow) <-> round (cat)
    a: { head: [86, 48], bones: ["20,92 100,92", "80,54 62,60 46,54", "78,56 78,88", "48,56 46,88", "80,56 84,70"] },
    b: { head: [86, 56], bones: ["20,92 100,92", "80,58 62,48 46,56", "78,58 78,88", "48,58 46,88", "80,58 84,72"] },
    dur: "3.6s",
  },
  hipcircle: {
    // standing, hips sway with hands on hips
    a: { head: [62, 18], bones: ["62,26 56,54", "56,54 52,74 50,92", "56,54 62,74 66,92", "48,50 62,40 70,52", "62,26 62,30"] },
    b: { head: [62, 18], bones: ["62,26 68,54", "68,54 60,74 56,92", "68,54 74,74 78,92", "54,52 62,40 76,50", "62,26 62,30"] },
    dur: "2.4s",
    hold: false,
  },
  armcircle: {
    // arms sweep between horizontal and overhead
    a: { head: [62, 18], bones: ["62,26 62,56", "62,56 62,74", "62,74 62,92 72,92", "40,36 62,34 84,36", "62,26 62,30"] },
    b: { head: [62, 18], bones: ["62,26 62,56", "62,56 62,74", "62,74 62,92 72,92", "46,16 62,30 78,16", "62,26 62,30"] },
    dur: "1.6s",
    hold: false,
  },

  // ---- Warm-up category pass (2026-07) ------------------------------------
  rower: {
    // seated erg on a rail: catch (knees bent, arms long) <-> finish (legs
    // long, lean back, handle to chest)
    a: { head: [50, 44], bones: ["20,88 100,88", "52,52 64,78", "64,78 80,62 92,74", "92,74 96,80", "54,56 86,58"] },
    b: { head: [42, 50], bones: ["20,88 100,88", "44,58 56,78", "56,78 74,76 92,74", "92,74 96,80", "46,62 70,60"] },
    dur: "1.6s",
    hold: false,
  },
  elliptical: {
    // standing glide: feet never leave the pedals, opposite arm drives
    a: { head: [60, 20], bones: ["30,92 94,92", "60,28 60,56", "60,56 72,72 76,86", "60,56 50,72 46,90", "60,34 74,40"] },
    b: { head: [60, 22], bones: ["30,92 94,92", "60,30 60,58", "60,58 52,74 46,88", "60,58 70,74 76,92", "60,36 46,42"] },
    dur: "1.4s",
    hold: false,
  },
  legswing: {
    // holding a static pole, one leg swings front <-> back
    a: { head: [58, 20], bones: ["88,30 88,92", "58,28 58,56", "58,56 58,74 58,92", "58,56 44,68 40,80", "58,34 86,38"] },
    b: { head: [58, 20], bones: ["88,30 88,92", "58,28 58,56", "58,56 58,74 58,92", "58,56 70,70 76,82", "58,34 86,38"] },
    dur: "1.5s",
    hold: false,
  },
  torsotwist: {
    // front view: loose arms sweep across as the torso rotates
    a: { head: [62, 18], bones: ["62,26 62,54", "62,54 54,74 52,92", "62,54 70,74 72,92", "62,32 40,34", "62,32 52,42"] },
    b: { head: [62, 18], bones: ["62,26 62,54", "62,54 54,74 52,92", "62,54 70,74 72,92", "62,32 72,42", "62,32 84,34"] },
    dur: "1.5s",
    hold: false,
  },
  shoulderroll: {
    // front view: shoulders (arm roots) ride up and back down
    a: { head: [62, 18], bones: ["62,26 62,56", "62,56 54,74 52,92", "62,56 70,74 72,92", "58,34 54,54", "66,34 70,54"] },
    b: { head: [62, 16], bones: ["62,24 62,56", "62,56 54,74 52,92", "62,56 70,74 72,92", "58,29 53,49", "66,29 71,49"] },
    dur: "2s",
    hold: false,
  },
  buttkick: {
    // jog in place, heel kicks toward the glute
    a: { head: [62, 18], bones: ["62,26 62,54", "62,54 60,74 58,92", "62,54 72,64 66,74", "62,32 74,40", "62,32 50,40"] },
    b: { head: [62, 18], bones: ["62,26 62,54", "62,54 72,66 64,76", "62,54 62,76 60,92", "62,32 50,40", "62,32 74,40"] },
    dur: "0.9s",
    hold: false,
  },
  deadhang: {
    // passive hang from the bar: slow shoulder-stretch breathing
    a: { head: [62, 26], bones: ["34,10 90,10", "62,34 62,58", "62,58 61,74 60,88", "62,36 52,23 52,10", "62,36 72,23 72,10"] },
    b: { head: [62, 29], bones: ["34,10 90,10", "62,37 62,61", "62,61 61,77 60,91", "62,39 52,25 52,10", "62,39 72,25 72,10"] },
    dur: "4s",
  },

  // ---- Gym machines & free-weight isolation (2026-07 pass) ---------------
  curl: {
    // standing curl: elbow pinned at the side, forearm arcs up
    a: { head: [62, 20], bones: ["62,28 62,56", "62,56 62,74", "62,74 62,92", "62,92 74,92", "62,34 66,52 68,68"] },
    b: { head: [62, 20], bones: ["62,28 62,56", "62,56 62,74", "62,74 62,92", "62,92 74,92", "62,34 66,52 50,40"] },
  },
  latraise: {
    // straight arm rises from the thigh to shoulder height
    a: { head: [62, 20], bones: ["62,28 62,56", "62,56 62,74", "62,74 62,92", "62,92 74,92", "62,34 68,48 72,60"] },
    b: { head: [62, 20], bones: ["62,28 62,56", "62,56 62,74", "62,74 62,92", "62,92 74,92", "62,34 76,37 88,36"] },
  },
  pushdown: {
    // slight forward lean, elbow pinned, forearm presses down to the thigh
    a: { head: [58, 20], bones: ["60,28 64,56", "64,56 62,74", "62,74 62,92", "62,92 74,92", "61,34 68,50 76,36"] },
    b: { head: [58, 20], bones: ["60,28 64,56", "64,56 62,74", "62,74 62,92", "62,92 74,92", "61,34 68,50 78,64"] },
  },
  legext: {
    // seated on the pad: shin swings from hanging down to locked out
    a: { head: [48, 30], bones: ["40,66 88,66", "50,38 62,62", "62,62 80,62", "80,62 78,86", "52,42 58,56"] },
    b: { head: [48, 30], bones: ["40,66 88,66", "50,38 62,62", "62,62 80,62", "80,62 96,58", "52,42 58,56"] },
  },
  legcurl: {
    // seated: shin sweeps from out front to tucked under the pad
    a: { head: [48, 30], bones: ["40,66 88,66", "50,38 62,62", "62,62 80,62", "80,62 96,64", "52,42 58,56"] },
    b: { head: [48, 30], bones: ["40,66 88,66", "50,38 62,62", "62,62 80,62", "80,62 76,84", "52,42 58,56"] },
  },
  fly: {
    // seated upright: straight arm sweeps from opened back to together in front
    a: { head: [58, 26], bones: ["44,66 84,66", "58,34 60,62", "60,62 78,64", "78,64 78,88", "58,38 44,40 32,42"] },
    b: { head: [58, 26], bones: ["44,66 84,66", "58,34 60,62", "60,62 78,64", "78,64 78,88", "58,38 72,40 86,42"] },
  },
  facepull: {
    // rope pulled from arms-long at eye height to elbow high beside the ear
    a: { head: [62, 20], bones: ["62,28 62,56", "62,56 62,74", "62,74 62,92", "62,92 74,92", "62,32 78,30 94,28"] },
    b: { head: [62, 20], bones: ["62,28 62,56", "62,56 62,74", "62,74 62,92", "62,92 74,92", "62,32 76,28 66,26"] },
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
