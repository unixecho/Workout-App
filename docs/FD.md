# RepUp — Functional Design (FD)

> **Living document.** This is the single source of truth for what RepUp does
> and how every screen behaves. Update it whenever a product decision changes.
> Status of each section is marked: ✅ drafted · 🚧 needs review · ⬜ placeholder.

---

## 1. Product Definition ✅

### 1.1 Personas

1. **The home beginner.** Works out at home, no equipment, little or no
   training history. Doesn't know what "proper form" looks like — needs
   **visual, animated form guidance** for every exercise, simple language,
   and plans that never assume a gym.
2. **The regular.** Already trains a few times a week but wants **structure
   and tracking**: a coherent weekly plan, a log of what they actually did,
   visible progress over time, and streaks to protect.
3. **The adapted trainee.** Injured, recovering, or limited mobility.
   Needs plans that **respect stated limitations** (e.g. "broken right arm",
   "bad knees"), substitute or skip unsafe movements, and include explicit
   safety cues per exercise.

### 1.2 Core loop

```
set goal → get/build weekly plan → do today's session in the workout player
→ log auto-tracks stats → earn badges/streaks → friends see activity
→ return tomorrow
```

Every design decision should reinforce this loop. If a screen doesn't feed
the loop (start today's session, see progress, feel social pull), question it.

---

## 2. Onboarding Flow 🚧 (drafted, needs review)

Goal: from install to an accepted weekly plan in under 3 minutes. Each step is
one focused screen; progress is indicated; back navigation always works;
nothing is lost if the user quits mid-flow (resume where they left off).

### S0 — Splash / Auth
- Brand moment (logo + tagline animation), then auth.
- **Supabase magic link** (email) + **Google OAuth**. No passwords in v1.
- Returning session skips straight to the app.

### S1 — Profile
- Handle (unique, checked live), display name, avatar (upload or generated
  placeholder).

### S2 — Body stats
- Age, height, weight.
- **kg/cm is the default**; a unit toggle (kg/cm ↔ lb/ft-in) persists to the
  profile and applies app-wide.

### S3 — Goal
- Single choice: **lose weight / build muscle / get stronger / endurance /
  stay healthy**.
- If the goal is weight-related: target weight input + a **projected
  timeline** shown immediately (rule-based estimate, clearly labeled as an
  estimate).

### S4 — Weekly availability & constraints
- Days per week (stepper), weekday picker (which days).
- Equipment: none / basic (bands, dumbbells) / full gym.
- **Limitations/injuries**: free-text field + quick chips (e.g. "knee",
  "shoulder", "back", "wrist"). Feeds the plan generator's exclusion rules.

### S5 — Plan reveal
- The generated week appears as **day cards** (staggered entrance animation —
  this is the payoff moment, make it feel earned).
- Two actions: **Accept plan** (→ home) or **Customize** (→ plan builder,
  section 3).

---

## 3. Plan Builder ⬜ PLACEHOLDER

> Design next. Required per screen: purpose, layout, every button and where
> it leads, states (empty/loading/error), edge cases.

## 4. Session Editor ⬜ PLACEHOLDER

## 5. Workout Player ⬜ PLACEHOLDER

> The reference prototype ([index.html](../index.html)) is the working draft
> of this screen. The FD section must formalize it: exercise list, expand
> interaction, rep steppers, timers, progress ring, completion states,
> mid-session exit/resume, and how logs are written.

## 6. Exercise Library ⬜ PLACEHOLDER

## 7. Stats & Progress ⬜ PLACEHOLDER

## 8. Badges ⬜ PLACEHOLDER

## 9. Profile & Settings ⬜ PLACEHOLDER

## 10. Social / Friends ⬜ PLACEHOLDER

> v1: friend requests, friend list, activity visibility (friends see your
> completed sessions/badges). Leaderboards are v1.5 — do not design them yet.

---

## Badges & Motivation ⬜ PLACEHOLDER

> Catalog of badges, unlock rules, streak mechanics (what counts as keeping a
> streak, grace rules, timezone handling).

---

## Theme & Design System

See [STYLE.md](../STYLE.md) — extracted from the reference prototype and
binding for every screen.
