# RepUp — Design System (STYLE.md)

Extracted from the reference prototype (`day1_workout_1.html`, committed here
as [index.html](index.html)). This is the binding visual language for **every**
screen in RepUp. The bar: indistinguishable from a first-party iOS app.

---

## 1. Palette

Exact values pulled from the reference file's `:root` tokens and usage.

### Surfaces

| Token | Value | Use |
| --- | --- | --- |
| `--bg` | `#0A0D12` | App background (near-black, blue-tinted) |
| `--bg-elev` | `#12161D` | Elevated surface (animation stages, trackers) |
| `--card` | `#171C24` | Card surface (grouped lists) |
| `--card-border` | `rgba(255,255,255,0.06)` | 1px card outline |
| `--hairline` | `rgba(255,255,255,0.08)` | Dividers between list rows |

### Text tiers

| Token | Value | Use |
| --- | --- | --- |
| `--ink` | `#F2F4F7` | Primary text |
| `--ink-dim` | `#9AA3AF` | Secondary text (metas, subtitles) |
| `--ink-faint` | `#5B6472` | Tertiary text (footnotes, inactive states) |

### Accents

| Token | Value | Use |
| --- | --- | --- |
| `--blue` | `#3D8BFD` | Primary accent: actions, eyebrows, active states, figure "bones" |
| `--green` | `#30D158` | Success: completion, progress ring, cue arrows |
| `--amber` | `#FF9F0A` | Warning: cautions, warm-up/cool-down icons, band elements |

### Accent tint recipe

Accents are never used as flat fills for containers — they appear as **low-alpha
tints of the accent color** on dark surfaces, with the accent itself as the
foreground:

- Icon chips / secondary buttons: accent at **10–18% alpha** background
  (e.g. `rgba(61,139,253,0.14)`, `rgba(48,209,88,0.16)`, `rgba(255,159,10,0.14)`)
- Pressed state: bump alpha roughly ×1.7 (e.g. `0.16 → 0.28`)
- Info blocks: accent at 10% alpha background + a **pastel version of the
  accent for body text** (`#CFE3FF` on blue tips, `#FFE3B8` on amber warnings),
  accent full-strength for the bold lead-in.
- Neutral interactive fills: `rgba(255,255,255,0.06–0.08)` resting,
  `rgba(255,255,255,0.16)` pressed.

### Ambient background glow

The app background is not flat — a fixed, z-indexed-behind layer adds two soft
radial glows (blue top corner at ~13% alpha, green bottom corner at ~8% alpha):

```css
background:
  radial-gradient(ellipse 80% 40% at 85% -5%, rgba(61,139,253,0.13), transparent 60%),
  radial-gradient(ellipse 70% 35% at 10% 108%, rgba(48,209,88,0.08), transparent 60%),
  var(--bg);
```

---

## 2. Typography

**Stack:** `-apple-system, "SF Pro Text", "SF Pro Display", system-ui, sans-serif`
with `-webkit-font-smoothing: antialiased`. No web fonts — the system font IS
the brand, exactly like a native app.

| Role | Size | Weight | Notes |
| --- | --- | --- | --- |
| Screen title | 34px | 800 | `letter-spacing: -0.02em` — big bold iOS large-title |
| Big numerals (reps/timer) | 38px | 800 | `font-variant-numeric: tabular-nums` so digits don't jiggle |
| Eyebrow | 13px | 600 | Uppercase, `letter-spacing: 0.02em`, accent blue |
| Subtitle | 15px | 500 | `--ink-dim` |
| Row/item name | 16px | 600 | `letter-spacing: -0.01em` |
| Section/emphasis | 15px | 700 | |
| Body / info text | 14px | 400 (700 for lead-ins) | `line-height: 1.5` |
| Meta / captions | 12.5–13px | 500–600 | `--ink-dim` or `--ink-faint` |

Rules: negative tracking on anything ≥16px; tabular numerals on any number
that changes; bold weight (700–800) does the hierarchy work, not color.

---

## 3. Spacing & shape

- Screen gutter: **16–20px** horizontal.
- Radii scale: **16px** grouped-list cards → **14px** inner panels (stage,
  tracker) → **12px** info blocks & full-width buttons → **10px** icon chips
  → **999px** pills & circular controls.
- Row padding: 14px 16px. Panel padding: 12–14px.
- 1px hairlines (`--hairline`) separate rows *inside* a card; cards get
  `--card-border` outlines.

---

## 4. Components

### Grouped list card
Rounded 16px container (`--card` + `--card-border`, `overflow:hidden`), rows
divided by hairlines. Row anatomy: 34px rounded icon chip (accent-tinted) →
name + meta stack → trailing status (check circle) → chevron. Header rows
respond to touch with `background: rgba(255,255,255,0.04)` on `:active`.

### Expanding row
Expansion uses the CSS Grid `grid-template-rows: 0fr → 1fr` technique animated
at `.35s cubic-bezier(.4,0,.2,1)`, with the chevron rotating in sync (`.3s`).
Only one row open at a time (accordion). This is the required pattern for any
inline expand/collapse — no JS height measuring.

### Circular progress ring
64px SVG, r=28, stroke-width 6, rounded caps. Track = `--hairline`, fill =
`--green`. Progress via `stroke-dasharray: 175.9` + animated `stroke-dashoffset`
(`transition: .5s ease`). Centered label (14px/700) shows `done/total`.

### Round stepper (±)
44px circular buttons (minimum tap target). Minus: neutral fill
`rgba(255,255,255,0.08)`. Plus: blue-tinted `rgba(61,139,253,0.18)` with blue
glyph. Pressed: alpha bump + `transform: scale(0.94)`. Center numeral 38px/800
tabular. Stepper rolls over between sets (max rep + 1 → next set, rep 0).

### Pill button
`border-radius: 999px`, 10px 18px padding, 14px/700 text, accent-tinted fill.
Pressed: alpha bump + `scale(0.96)`.

### Full-width action button
12px radius, 14px padding, 15px/700. Neutral resting
(`rgba(255,255,255,0.06)`); completed state swaps to green tint + green text.
Pressed: `scale(0.98)`.

### Set-dot progress indicators
7px circles, 6px gap. States: idle `--ink-faint` → active `--blue` → filled
`--green`, transitioning at `.2s ease`.

### Info blocks (tip / warn)
12px radius, 10% alpha accent background, pastel body text, bold accent
lead-in ("**Form —**", "**Avoid —**"). Tips are blue, warnings amber.

### Sticky header
Sticky topbar with `backdrop-filter: blur(14px)` and a gradient scrim from 96%
opaque `--bg` to transparent, so content visibly scrolls *under* it —
signature iOS behavior. Contains eyebrow / large title / subtitle.

---

## 5. Motion system

### Principles (from the reference, binding everywhere)

1. **Every tap responds.** Every interactive element has an `:active` state —
   scale down (0.94–0.98) and/or fill brightening — within one frame.
   `-webkit-tap-highlight-color: transparent` always; we own the feedback.
2. **Transform/opacity only** for anything that moves every frame. The one
   layout-ish exception is the `0fr→1fr` grid expand, used sparingly.
3. **Eased, never linear.** Reference easings: `cubic-bezier(.4,0,.2,1)` for
   structural moves, plain `ease` for state fills, ~150–350ms durations.
4. Honor `@media (prefers-reduced-motion: reduce)` in everything we build.

### Exercise demo animations — required technique

The reference implements exercise demos as **animated SVG stick figures**:
line-segment "bones" (blue, 6–7px round-capped strokes) + a circle head,
animated through one rep cycle with:

- **Pause-at-extremes rep timing**: keyframe times `0 → 0.4 → 0.6 → 1` — the
  movement eases down (0–40%), **holds at the bottom** (40–60%), eases back up
  (60–100%). This hold is what makes it read as a deliberate, coached rep
  instead of a bouncing loop.
- **Eased interpolation** into and out of the hold
  (spline `.42 0 .58 1` ≈ ease-in-out), linear across the hold.
- ~3–3.2s per rep cycle, looping indefinitely.
- **Green cue arrows** + a bold caption ("Hips **back and down** · chest up")
  telling the user what to attend to; **amber** for equipment like bands;
  ghosted strokes (35% opacity) for limbs that intentionally stay still.

An equivalent production technique is **sprite-sheet playback**: pre-rendered
frames (e.g. 12 per rep, with eased/pause-at-extremes spacing baked into the
frames) played via CSS `steps()` on `background-position`. Same visual result,
trivially cacheable, zero runtime animation cost.

**Rule: all exercise demos in RepUp use one of these two techniques through a
single shared component — never GIFs, never videos, never per-screen
reimplementations.**

### React component contract

```tsx
<ExerciseSprite
  name="squat"            // exercise id → resolves animation asset/def
  caption?={<>Hips <b>back and down</b> · chest up</>}
  cue?="hips-back"        // optional cue-arrow overlay id
  playing?={true}         // pause support (and reduced-motion auto-pause)
  size?="md"              // sm (list thumb) | md (stage, default) | lg
/>
```

Contract requirements:
- Renders inside the standard **stage** panel: `--bg-elev` background with a
  faint blue radial glow, 14px radius, caption slot beneath.
- One component, one registry of exercise animation definitions. Adding an
  exercise = adding a data entry, not writing new animation code.
- Respects `prefers-reduced-motion` (renders a static mid-rep pose).
- Implementation detail (SVG-animated vs sprite-sheet `steps()`) is internal
  and swappable per exercise without changing call sites.

---

## 6. Platform priority

**iPhone/mobile-first, PWA-capable.**

- `viewport-fit=cover` + safe-area awareness everywhere:
  `env(safe-area-inset-top/bottom)` padding on sticky headers and bottom
  actions (the reference wires these as `--safe-top`/`--safe-bottom` tokens).
- `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`
  (black-translucent), app icons / `apple-touch-icon` — add-to-home-screen
  ready from day one.
- `user-scalable=no, maximum-scale=1` app-style viewport;
  `overscroll-behavior-y: none` to kill scroll-chaining bounce.
- Design at 390px width first; desktop is a centered, constrained column —
  never a "desktop layout".
