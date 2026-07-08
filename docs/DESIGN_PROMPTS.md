# RepUp — Claude Design Prompts

Ready-to-fire prompts for generating high-fidelity mockups of every v1
screen, derived from [FD.md](FD.md) and [../STYLE.md](../STYLE.md). Each
screen prompt is **self-contained** — it repeats the design tokens it needs,
so it can be pasted into a fresh Claude Design session on its own.

## How to use these

1. Paste **one prompt at a time**, in order (onboarding first, workout
   player next — it's the highest-bar screen and the rest should be judged
   against it).
2. Each prompt asks for a single self-contained HTML file (inline CSS/JS, no
   frameworks, no external assets, no build step) — the same technique as the
   existing reference prototype ([../index.html](../index.html)). This keeps
   outputs directly comparable and directly reviewable in a browser.
3. After generating, sanity-check against the **Design DNA compliance
   checklist** at the bottom of this file before accepting a screen.
4. Once a screen mockup is approved, it becomes the reference for porting
   that screen into the real Next.js app (post-FD-approval work).

If a prompt's output drifts from the design system, the fix is almost always
"reuse token X instead of inventing a new value" — point back at the DNA
block below, don't let new colors/radii/easings creep in per screen.

---

## Design DNA (shared preamble — included in every prompt below)

```
You are building a screen for RepUp, an iOS-native-feeling fitness app.
The bar is Apple/iOS first-party polish — nothing may look like "a website."
Every tap has an immediate response; every transition is smooth; motion
uses transform/opacity, never layout thrashing.

OUTPUT FORMAT
Produce a single self-contained HTML file: inline <style> and <script>,
no external assets, no frameworks, no build step, no network calls.
Viewport: mobile-first at 390×844 (iPhone-class), viewport-fit=cover,
safe-area-aware. Include realistic placeholder content, not lorem ipsum —
use plausible fitness data (exercise names, numbers, names, dates).

DESIGN TOKENS (do not invent new colors, radii, or easings — reuse these)
Surfaces:
  --bg:#0A0D12   --bg-elev:#12161D   --card:#171C24
  --card-border: rgba(255,255,255,0.06)   --hairline: rgba(255,255,255,0.08)
Text:
  --ink:#F2F4F7 (primary)   --ink-dim:#9AA3AF (secondary)
  --ink-faint:#5B6472 (tertiary)
Accents:
  --blue:#3D8BFD (primary actions, active states)
  --green:#30D158 (success/completion)
  --amber:#FF9F0A (warnings/caution)
Accent tint recipe: accents never fill containers flatly — use 10–18% alpha
tints as backgrounds (e.g. rgba(61,139,253,0.14)) with the full-strength
accent as foreground/text; pressed state bumps alpha ~×1.7. Neutral
interactive fills: rgba(255,255,255,0.06–0.08) resting, 0.16 pressed.
Ambient background: fixed radial glow layer behind everything —
  radial-gradient(ellipse 80% 40% at 85% -5%, rgba(61,139,253,0.13), transparent 60%),
  radial-gradient(ellipse 70% 35% at 10% 108%, rgba(48,209,88,0.08), transparent 60%),
  var(--bg)

TYPOGRAPHY
Font stack: -apple-system, "SF Pro Text", "SF Pro Display", system-ui, sans-serif
(-webkit-font-smoothing: antialiased). No web fonts.
  Screen title: 34px/800, letter-spacing -0.02em
  Big numerals (reps/timers/stats): 38px/800, font-variant-numeric: tabular-nums
  Eyebrow: 13px/600, uppercase, letter-spacing 0.02em, color var(--blue)
  Subtitle: 15px/500, var(--ink-dim)
  Row/item name: 16px/600, letter-spacing -0.01em
  Section/emphasis: 15px/700
  Body/info text: 14px/400 (700 for bold lead-ins), line-height 1.5
  Meta/captions: 12.5–13px/500–600, var(--ink-dim) or var(--ink-faint)

SPACING & SHAPE
Screen gutter 16–20px. Radii: 16px (grouped cards) > 14px (inner panels) >
12px (info blocks, full-width buttons) > 10px (icon chips) > 999px (pills,
circular controls). Row padding 14px 16px. 1px hairlines divide rows inside
a card; cards get --card-border outlines.

CORE COMPONENTS (reuse, don't reinvent)
- Grouped list card: 16px radius, --card bg + --card-border outline,
  overflow hidden, rows divided by hairlines. Row: 34px rounded icon chip
  (accent-tinted bg) + name/meta stack + trailing status + chevron.
  :active row gets background rgba(255,255,255,0.04).
- Expanding row: CSS Grid grid-template-rows 0fr→1fr, .35s
  cubic-bezier(.4,0,.2,1), chevron rotates in sync (.3s). One open at a time.
- Circular progress ring: SVG, r=28, stroke-width 6, rounded caps, track
  --hairline, fill --green, stroke-dasharray/dashoffset animated .5s ease,
  centered done/total label.
- Round stepper (±): 44px circles. Minus: rgba(255,255,255,0.08) neutral.
  Plus: rgba(61,139,253,0.18) blue-tinted. :active → alpha bump + scale(0.94).
- Pill button: radius 999px, 10px 18px padding, 14px/700, accent-tinted fill,
  :active alpha bump + scale(0.96).
- Full-width action button: 12px radius, 14px padding, 15px/700, neutral
  resting (rgba(255,255,255,0.06)); completed = green tint + green text;
  :active scale(0.98).
- Set-dot progress: 7px circles, 6px gap, idle var(--ink-faint) → active
  var(--blue) → filled var(--green), .2s ease.
- Info block (tip/warn): 12px radius, 10% alpha accent bg, pastel body text
  (#CFE3FF on blue, #FFE3B8 on amber), bold accent lead-in ("Form —").
- Sticky header: backdrop-filter blur(14px), gradient scrim from 96% opaque
  --bg to transparent, content visibly scrolls under it. Eyebrow/title/sub.
- Bottom tab bar (5 tabs: Today · Plan · Stats · Friends · Profile):
  blur background, safe-area-bottom padded, active tab in --blue with a
  filled icon variant, inactive in --ink-faint.

MOTION RULES
Every tap gets an immediate :active response (scale 0.94–0.98 and/or fill
brightening) — set -webkit-tap-highlight-color:transparent and own the
feedback yourself. Animate transform/opacity only wherever possible.
Structural moves: cubic-bezier(.4,0,.2,1). State fills: ease. Durations
150–350ms. Respect @media (prefers-reduced-motion: reduce) by disabling
non-essential motion. Make interactions feel instant, not spinner-and-wait —
optimistic UI updates.

PLATFORM
iPhone-first, PWA-capable: env(safe-area-inset-top/bottom) padding on sticky
headers/bottom bars/tab bar, apple-mobile-web-app meta tags, user-scalable=no,
overscroll-behavior-y:none.
```

---

## Prompt 1 — Onboarding flow (S0–S5)

```
[Paste the Design DNA block above first.]

Build the RepUp onboarding flow: 6 screens the user swipes/taps through
linearly, each full-screen, with a slim progress indicator (segmented bar,
top, safe-area aware) showing step n/6 and a back chevron (top-leading,
hidden on S0). Wire simple JS so tapping "Continue" advances screens with a
smooth slide+fade transition (translateX + opacity, cubic-bezier(.4,0,.2,1),
~350ms) and Back reverses it. Persist nothing — this is a visual mockup.

S0 — Splash/Auth: centered brand lockup (wordmark "RepUp", tagline "Train
smarter, together"), entrance animation (fade+scale in). Below: a primary
full-width "Continue with Google" button and a secondary "Continue with
email" pill that reveals an inline email field + "Send magic link" button.

S1 — Profile: title "Set up your profile". Avatar circle (tap to
change — show a placeholder camera icon), handle field with live-feeling
availability check (green checkmark), display name field.

S2 — Body stats: title "Tell us about you". Age field, height field, weight
field, with a segmented kg/cm ↔ lb/ft-in unit toggle pinned near the weight
field that visibly changes the field suffixes when tapped.

S3 — Goal: title "What's your goal?" — 5 large selectable cards stacked
(lose weight / build muscle / get stronger / endurance / stay healthy), each
with an icon, label, and one-line description; selected state gets a blue
border + tinted background. Selecting "lose weight" reveals (animated
height-in) a target weight field + a projected timeline line ("At this
pace: ~14 weeks", ink-dim, small italic-style note that this is an
estimate).

S4 — Availability: title "When can you train?" — a stepper for days/week (±,
44px round buttons), a 7-dot weekday picker (M T W T F S S, tappable
toggles, selected = filled blue), equipment segmented control (None /
Basic / Full gym), a free-text limitations field with quick-add chips below
it (Knee, Shoulder, Back, Wrist — tapping a chip appends it to the text
field).

S5 — Plan reveal: title "Your week is ready" with a subtitle. 7 day cards
staggered fade+slide-up entrance (each delayed ~60ms after the previous),
each showing day label, session title, muscle chips, duration; rest days
render dimmed with a moon icon. Footer: two buttons — primary "Accept plan",
secondary "Customize".

Make the S5 entrance the emotional payoff — it should feel earned after 5
short steps. Wire it so navigating from S4 to S5 shows a brief (600ms)
"Building your plan…" loading state (pulsing shimmer on card-shaped
skeletons) before the real cards animate in.
```

---

## Prompt 2 — Today (Home)

```
[Paste the Design DNA block above first.]

Build RepUp's "Today" home screen — the daily landing screen, reached first
after login. Include the 5-tab bottom bar (Today active) per the DNA.

Layout top to bottom:
1. Sticky header: eyebrow "TUESDAY, JUL 8", large title "Let's go, Alex",
   with a streak chip pinned trailing (flame icon + "12", blue-tinted pill).
2. Hero session card: "Push Day — Chest & Triceps", muscle chips, "45 min",
   "6 exercises", large primary "Start" button full-width. Build this card
   with THREE swappable states controlled by three small buttons above the
   phone frame labeled "Not started / In progress / Complete" (for review
   purposes only, not in-product UI):
   - Not started: as described, "Start" button.
   - In progress: circular progress ring (2/6) replaces part of the header,
     button reads "Resume".
   - Complete: green-tinted card, checkmark, "6 exercises · 34 min", button
     replaced by a subtle "View summary" row.
3. Week strip: 7 small day tiles in a horizontal row — states: completed
   (green check), today (blue ring, subtle pulse animation), upcoming
   (neutral outline), rest (moon icon, dimmed), missed (dim amber outline).
   Mix all 5 states across the week for the mockup.
4. Friends ticker: compact card, "Friends" label + "See all" link, 3 rows
   (avatar, name, "completed Day 2 · 🔥 12", relative time).
5. Next badge teaser: compact card, badge icon (silhouette), "2 workouts to
   go", label "10 Workouts", thin progress bar.

Every card/row gets a realistic :active press state. Hero button press
should feel the most "alive" — combine scale(0.98) with a brief brightness
lift.
```

---

## Prompt 3 — Plan Builder

```
[Paste the Design DNA block above first.]

Build RepUp's "Plan" tab — the weekly plan builder. Include the 5-tab
bottom bar (Plan active).

Header: editable plan name "Push/Pull/Legs Plan" (looks tap-to-edit — pencil
affordance), a week selector segmented control ("This week" / "Next week"),
and a trailing "Library" icon button.

Body: 7 day cards, vertical list, Mon–Sun. Workout day card: day label
("MON"), session title, muscle chips, duration, exercise count, a leading
drag-handle icon, and a trailing "⋯" button. Rest day card: dimmed, moon
icon, "Rest day", also with "⋯". Give at least one day a "Today" accent
outline and at least one a green "done" checkmark in the corner (past,
completed).

Wire the "⋯" button on one card to open a bottom sheet (slide up, grabber
handle, backdrop dim+blur) with 3 rows: "Move to…", "Convert to rest day",
"Duplicate to another day".

Footer: secondary full-width "Regenerate week" button. Tapping it opens a
confirm sheet: title "Regenerate this week?", body "Replaces this week's
remaining days. Completed days are kept.", Cancel + destructive-styled
Confirm.

Add a dismissible banner above the day list (amber-tinted, info-block style)
reading "Your training settings changed. Regenerate remaining days?" with
inline "Regenerate" / "Keep as is" text buttons — demonstrate this state but
make it closeable.
```

---

## Prompt 4 — Session Editor

```
[Paste the Design DNA block above first.]

Build RepUp's Session Editor — editing one day's workout, reached by tapping
a day card in the Plan Builder. This is a pushed screen (back chevron,
top-leading) with a footer-pinned primary "Save" button (full-width, only
visually "enabled" — bright — because this mockup should show the dirty
state; show a small "• Edited" indicator near the header title).

Header: editable session title "Push Day — Chest & Triceps", day label
"Monday", and an auto-computed duration line ("~52 min") with a small amber
note beneath it: "~52 min — longer than your usual 45".

Body: grouped list card of exercise rows — icon chip, name, dose summary
("3 × 12–15" or "3 × 30s"), drag handle (trailing, before an implicit
reorder affordance). Pin a "Warm-up" row first and "Cool-down" row last,
visually distinguished (slightly muted) from the 5 reorderable rows between
them. Give one row an amber warning dot (conflicts with a stated
limitation).

Below the list: a "＋ Add exercise" row in blue, dashed-border style,
matching the card radius.

Wire tapping a normal exercise row to open a bottom sheet: exercise name
header, sets stepper (± ), reps stepper (± ) OR a seconds picker for a
different exercise (show reps-based in this sheet), rest-between-sets
stepper, and two footer text-buttons: "Swap exercise" and destructive
"Remove".
```

---

## Prompt 5 — Workout Player

```
[Paste the Design DNA block above first.]

Build RepUp's Workout Player — full-screen takeover, no tab bar, the
product's centerpiece screen. This should meet or exceed the quality of the
existing reference implementation (animated SVG exercise demos with
pause-at-extremes rep timing, circular ring, accordion list, rep/timer
trackers) — treat that as the literal baseline, then push the polish
further: richer micro-interactions, a genuinely satisfying completion
celebration, and tighter spacing rhythm.

Structure exactly per this spec:
1. Sticky header: leading Close (✕) button, eyebrow (plan name), large title
   (day title, 34px/800), subtitle (focus + est. duration). Blur + gradient
   scrim so the list visibly scrolls underneath it. Trailing "⋯" overflow
   button.
2. Progress block: 64px circular ring (n/total, animated stroke-dashoffset),
   "Today's session" label + live status line ("3 of 6 done").
3. Accordion exercise list (grouped card): rows for at least 5 exercises
   including a warm-up, 3 main lifts, and a cool-down. One row expanded.

   Expanded row must include, in order:
   a. Animation stage (--bg-elev panel, radial blue glow, 14px radius):
      an animated SVG stick-figure demo of a squat — side view, hips travel
      back+down, chest stays up, torso leans forward slightly, knee/hip/ankle
      joints animate with keyframe times 0→0.4→0.6→1 (ease down, HOLD at the
      bottom 40–60%, ease back up), ~3s loop, blue 6-7px round-capped
      "bones", a circle head, a green cue-arrow + caption below reading
      "Hips <b>back and down</b> · chest up".
   b. Tracker: rep stepper — set-dots (3), ± 44px round buttons flanking a
      38px/800 tabular numeral "8 / 12", "Set 2 of 3" label beneath.
   c. Info blocks: blue tip ("<b>Form —</b> Sit back like reaching for a
      chair behind you...") and amber note ("<b>Watch for —</b> knees
      caving inward").
   d. Full-width "Mark Complete" button.

   Give a second, collapsed row a timer-based tracker preview visible in its
   meta text ("3 sets × 30s"), and mark one row's meta with "optional".

4. Footer note: small centered safety reminder text.

Wire real interactivity: accordion expand/collapse (grid 0fr→1fr, .35s),
working ± steppers with set rollover, a working Start/Reset timer pill pair
for a second exercise type, Mark Complete toggling that row green and
advancing the ring with a smooth .5s ease stroke-dashoffset transition.

When the LAST row is marked complete, trigger a full-screen completion
celebration overlay: the ring completing with a brief scale/glow burst,
"Workout complete 💪", a summary line ("6 exercises · 34 min · 142 reps"),
then 1-2 badge-earned cards revealing in sequence (staggered scale+fade in,
~150ms apart) each with a badge icon, name, and "New!" tag, and finally a
single primary "Done" button. This moment should feel like the best 3
seconds in the app — make the motion count.
```

---

## Prompt 6 — Exercise Library

```
[Paste the Design DNA block above first.]

Build RepUp's Exercise Library in TWO views toggleable by a button at the
top of the mockup (for review purposes): "Browse" and "Detail".

Browse view:
- Search bar (iOS-style, rounded, magnifying glass icon; show it focused
  with an inline "Cancel" text button appearing to its trailing side).
- Horizontally scrollable filter chip row: "All", "Legs", "Push", "Pull",
  "Core", "Equipment", "Beginner", and a distinct "Safe for me" chip in
  blue-tinted styling, shown as active/selected.
- List of ~6 exercise cards: square thumbnail (a static mid-pose SVG stick
  figure, not animated), name, muscle chips (small pills), difficulty shown
  as 3 dots (filled = difficulty level), equipment icon. Give one card an
  amber warning badge (small triangle icon, top-trailing of the thumbnail)
  indicating a limitation conflict.

Detail view (for one exercise, e.g. "Glute Bridge"):
- Full animation stage identical in style to the Workout Player's (looping
  SVG demo + green cue caption).
- Meta row: muscle groups, difficulty dots, equipment icon+label.
- Blue info block "Form" (bulleted or prose cues).
- A second blue-toned block "Common mistakes" (bulleted, 2-3 items).
- Amber info block "Adaptations" — one line keyed to a limitation, e.g.
  "Limited knee flexion — reduce range of motion, stop before discomfort."
- Footer-pinned primary button "Add to session" (this view is being shown
  in picker mode).

Both views share the same card/chip/info-block styling from the DNA block.
```

---

## Prompt 7 — Stats & Progress

```
[Paste the Design DNA block above first.]

Build RepUp's "Stats" tab. Include the 5-tab bottom bar (Stats active).

Layout top to bottom, each block in its own card unless noted:
1. Streak header (no card, sits directly on background): large flame icon +
   "12" current streak (38px/800 tabular), smaller "Longest: 28" beside it,
   and a small "❄️ ×2" freeze-count chip.
2. "This week" card: mini ring (small version of the 64px ring) + "4/5
   sessions this week".
3. Consistency chart card: a simple CSS/SVG bar chart, 8 bars (sessions per
   week, last 8 weeks), var(--blue) bars with rounded tops on var(--hairline)
   baseline, axis labels in var(--ink-faint). Segmented toggle above it:
   "8W / 6M / All" (8W active).
4. Body weight card: a simple SVG line chart (weight over time) with a
   dashed goal line in var(--amber), current value large and tabular, a
   small trailing "＋ Add weigh-in" pill button.
5. Totals row: 3 stat tiles side by side (Workouts / Minutes / Reps), each
   large tabular number + small label beneath, no card background needed —
   subtle dividers between the three.
6. Muscle balance card: horizontal bar rows per muscle group (Legs, Push,
   Pull, Core), bars in var(--blue) with lengths implying "legs" is roughly
   2x "push" — a small ink-dim note beneath: "Legs getting 2× your chest
   volume".
7. Badges row: compact card, badge icon stack preview + "14/18 earned" +
   chevron.
8. History list: grouped card, 4-5 rows, each a past completed session
   (date, title, duration), reverse-chronological.

Give every number a subtle count-up feel is not required (static mockup),
but use tabular-nums throughout so nothing looks jittery.
```

---

## Prompt 8 — Badges

```
[Paste the Design DNA block above first.]

Build RepUp's Badges screen (reached from Stats). Pushed screen, back
chevron header, title "Badges", subtitle "14 of 18 earned".

Body: sectioned 3-up grid under section headers — "Streaks", "Milestones",
"Volume", "Social", "Special". Each badge tile: circular badge icon
(~64px), name beneath (12.5px/600).

- Earned badges: full-color icon (use gradient-filled circle badges in
  var(--blue)/var(--green) tones with a simple emblem — flame for streaks,
  trophy for milestones, dumbbell for volume, handshake for social), small
  earn-date caption beneath the name.
- Unearned badges: same badge shape but desaturated/silhouette (low-opacity
  var(--ink-faint) fill), a thin progress bar beneath (var(--card) track,
  var(--blue) fill), short hint text ("4/7").
- Special-section unearned badges: show "???" as the name, fully
  silhouetted, no progress bar (secret badges).

Wire one badge tap to open a bottom sheet: large badge icon, name,
description ("Complete a 30-day streak"), exact progress ("23/30"), and a
projected-completion line in ink-dim ("At this pace: ~Aug 3").
```

---

## Prompt 9 — Profile & Settings

```
[Paste the Design DNA block above first.]

Build RepUp's Profile tab. Include the 5-tab bottom bar (Profile active).

Header block (no card): centered-left avatar (72px circle), display name
(20px/700), "@handle" (ink-dim), "Joined March 2026" (ink-faint, small), and
a mini-stats row of 3 compact stat chips (🔥12 streak · 14 badges · 62
workouts).

Body: grouped settings list cards (16px radius, hairline-divided rows,
chevron trailing on every row), sectioned with small uppercase eyebrow
headers above each group, matching iOS Settings app conventions:

- ACCOUNT: "Edit profile", "Email", "Connected accounts"
- BODY & GOAL: "Body stats", "Units  kg · cm", "Goal  Build muscle"
- TRAINING: "Availability  4 days/week", "Equipment  Basic", "Limitations"
- NOTIFICATIONS: "Workout reminder  7:00 AM", "Friend activity", "Badge
  earned" (last two rows show iOS-style toggle switches instead of chevrons
  — build a working toggle switch component: pill track, circular knob,
  var(--blue) when on)
- PRIVACY: "Activity visibility  Friends" (row shows current value as
  trailing ink-dim text before the chevron)
- ABOUT: "Version 1.0.0", "Legal"

Footer (outside any card): centered "Sign out" text button (var(--ink-dim)),
and below it a smaller destructive "Delete account" text button (a muted
red, not the app's accent colors — this is the one intentional exception).

Every settings row gets the standard :active press feedback.
```

---

## Prompt 10 — Social / Friends

```
[Paste the Design DNA block above first.]

Build RepUp's Friends tab. Include the 5-tab bottom bar (Friends active).
Header: title "Friends", trailing "＋" button (Add friend). Below the
header: a segmented control "Activity | Friends" (Activity active by
default — build both, toggle between them with a button).

Activity segment: vertical feed of 4-5 cards, newest first. Card anatomy:
avatar (leading), name + event text ("completed Push Day"), context line
beneath (🔥12 streak, or "🏅 earned 10 Workouts"), relative timestamp
(trailing, small, ink-faint), and a trailing "👊" fist-bump button (pill,
neutral resting) — tapping it should visibly increment a small count next
to it and briefly pulse/scale. Include one "badge earned" event card styled
slightly differently (subtle accent-tinted left border or icon in var(--green)).

Friends segment:
- "Requests" section (only if present) — one incoming request row: avatar,
  name, "Accept" (blue pill) + "Decline" (neutral pill) buttons side by
  side.
- "Friends" list: grouped card, 5 rows, avatar + name + trailing flame icon
  with streak number, sorted implication (most active first).

Wire the "＋" button to open a sheet: a search field with 2-3 live-feeling
result rows (avatar, name, "Add" pill button), and beneath it a divider
labeled "or" then a full-width "Share invite link" button with a link/share
icon.

Also build a compact empty-state variant (toggle button at the top of the
mockup, "Show empty state"): illustration-less, centered icon + "Training
is better with backup" + stacked "Add friend" and "Share invite link"
buttons.
```

---

## Design DNA compliance checklist

Run through this after generating each screen — reject/regenerate anything
that fails:

- [ ] Only the documented colors appear (no new hex values invented)
- [ ] Radii match the scale (16/14/12/10/999 — nothing arbitrary like 8px
      or 20px sneaking in)
- [ ] System font stack only — no Google Fonts, no other typefaces
- [ ] Every tappable element has a visible `:active` state
- [ ] Animations use transform/opacity (except the documented grid-rows
      expand exception) and an eased curve, never `linear`
- [ ] Safe-area insets respected on sticky headers / bottom bars / footers
- [ ] Numbers that can change use tabular-nums
- [ ] No spinners for things that could be optimistic/instant
- [ ] Nothing reads as a "default web component" (default `<select>`,
      default checkbox, browser-native date input, etc.) — everything is
      custom-styled to the system
