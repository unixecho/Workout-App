# RepUp — Functional Design (FD)

> **Living document.** This is the single source of truth for what RepUp does
> and how every screen behaves. Update it whenever a product decision changes.
> Status of each section is marked: ✅ drafted · 🚧 needs review · ⬜ placeholder.
>
> Decisions the assistant made autonomously that the owner may want to tune
> are collected in [Appendix A](#appendix-a--product-knobs-for-owner-review).

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

The animated demos serve everyone: beginners learn the movement, regulars
confirm form, adapted trainees see exactly which limb stays still.

### 1.2 Core loop

```
set goal → get/build weekly plan → do today's session in the workout player
→ log auto-tracks stats → earn badges/streaks → friends see activity
→ return tomorrow
```

Every design decision should reinforce this loop. If a screen doesn't feed
the loop (start today's session, see progress, feel social pull), question it.

### 1.3 Navigation model 🚧

- **Bottom tab bar, 5 tabs** (iOS-style, blur background, safe-area padded):
  **Today · Plan · Stats · Friends · Profile**.
- The **Exercise Library** is not a tab — it's reached from the Plan tab
  header, from exercise rows in the Workout Player, and as the picker inside
  the Session Editor.
- Modality rules: **sheets** (slide-up, grabber handle) for edits and quick
  entry; **push navigation** for drill-ins; **full-screen takeover** only for
  the Workout Player and the session-complete celebration.
- Tab state is preserved when switching tabs. Re-tapping the active tab
  scrolls to top.

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
- Two actions: **Accept plan** (→ Today tab) or **Customize** (→ Plan
  Builder, section 4).

---

## 3. Today (Home) ✅ 🚧

**Purpose.** The daily landing screen. One glance answers "what do I do
today, and how am I doing?" — and one tap starts it. This screen carries the
return-tomorrow half of the core loop.

**Layout** (top → bottom):
1. **Header** — date eyebrow ("TUESDAY, JUL 8"), large greeting title
   ("Let's go, ‹name›"), and a **streak chip** (flame icon + day count)
   pinned trailing.
2. **Today's session card** (hero). Session title, muscle-group chips,
   estimated duration, exercise count. If untouched: a single prominent
   **Start** button. If in progress: the progress ring (n/total) and the
   button reads **Resume**. If done: green completed state with summary
   ("6 exercises · 34 min") .
3. **Week strip** — 7 dots/mini-cards for the current week: completed
   (green check), today (blue, pulsing subtly), upcoming (neutral), rest
   (moon icon), missed (dim amber outline).
4. **Friends ticker** — up to 3 most recent friend activity items ("Maya
   completed Day 2 · 🔥 12"), compact rows.
5. **Next badge teaser** — the closest unearned badge with a progress bar
   ("2 workouts to go → *10 Workouts*").

**Buttons & destinations:**
| Control | Leads to |
| --- | --- |
| Start / Resume | Workout Player (full-screen), today's session |
| Completed session card tap | Session summary sheet (read-only log) |
| Streak chip | Streak detail sheet (current, longest, freeze count, rules) |
| Week strip day tap | Session preview sheet (exercise list; **Edit** → Session Editor for future days) |
| Friends ticker row / "See all" | Friends tab (Activity segment) |
| Badge teaser | Badges screen (via Stats tab, badge highlighted) |

**States:**
- **Rest day**: hero card becomes a calm recovery card ("Rest day — recovery
  is training too"), with a subtle link "Do a light session anyway" → session
  preview of an optional mobility session.
- **No plan** (e.g. user skipped S5): empty hero with CTA **Create my plan**
  → Plan Builder generation flow.
- **Week complete**: celebratory hero, next week's plan preview.
- **Loading**: skeleton hero + strip (no spinners).
- **Offline**: fully functional from cached plan; a quiet "offline — will
  sync" pill under the header. **Error** (sync failure): non-blocking toast,
  retry silently.

**Edge cases:**
- Streak at risk (scheduled day, evening, not started): hero copy shifts to
  urgency + the reminder notification deep-links here.
- Session started but abandoned days ago: card offers **Resume** and
  **Start fresh** (sheet choice).
- User opens app in a new timezone: today = device-local calendar day (see
  streak rules, section 11).

---

## 4. Plan Builder ✅ 🚧

**Purpose.** View and shape the weekly plan. Entered from onboarding S5
("Customize"), from the Plan tab, or from Today's empty state. This is where
rule-based generation output becomes *the user's own* plan.

**Layout:**
1. Header: plan name (editable inline, default "‹Goal› Plan"), week selector
   (this week / next week), **Library** button (top trailing) → Exercise
   Library (browse mode).
2. **7 day cards** in a vertical list (Mon–Sun per user's week start).
   Workout card: day label, session title, duration, muscle chips, exercise
   count. Rest card: dimmed, moon icon, "Rest".
3. Footer actions: **Regenerate week** (secondary style).

**Buttons & destinations:**
| Control | Leads to |
| --- | --- |
| Day card tap | Session Editor for that day |
| Day card long-press drag (or ⋯ → "Move to…") | Reorder sessions between days; rest days swap accordingly |
| Day card ⋯ menu | Move to… / Convert to rest day / Duplicate to another day |
| Rest day card tap | "Add a session" → template picker sheet (generated suggestions) → Session Editor |
| Regenerate week | Confirm dialog ("Replaces this week's remaining days. Completed days are kept.") → regenerate → cards animate in |
| Library (header) | Exercise Library, browse mode |

**States:**
- **Generating**: day cards appear as shimmering skeletons, then populate
  with the staggered entrance (same animation as S5 reveal).
- **Empty** (no plan): single CTA card **Generate my week** (uses stored
  goal/availability; if missing → routes through S3/S4 forms first).
- **Error** (generation failed): inline card with Retry.

**Edge cases:**
- Editing **today** while a session is in progress: warn sheet ("You're
  mid-workout. Changes apply after you finish.") — edits queue, player state
  is never mutated underneath the user.
- Past days are **view-only** (tap → read-only session summary).
- Availability/limitations changed in Profile: banner appears here — "Your
  settings changed. Regenerate remaining days?" [Regenerate] [Keep as is].
- Regenerate keeps completed days' history untouched (history is immutable).

---

## 5. Session Editor ✅ 🚧

**Purpose.** Edit a single day's session: which exercises, their order, and
their dose (sets × reps / time). Reached from Plan Builder or the week strip.

**Layout:**
1. Header: session title (editable), day label, **auto-updating estimated
   duration** (recomputes live as exercises change).
2. **Grouped list** of exercise rows (STYLE.md grouped-card): icon, name,
   dose summary ("3 × 12–15"), drag handle. Warm-up and cool-down are pinned
   first/last (reorderable within the middle block only).
3. **Add exercise** row (＋, blue) at the list bottom.
4. Footer: **Save** (primary, full-width) — only enabled when dirty.

**Buttons & destinations:**
| Control | Leads to |
| --- | --- |
| Exercise row tap | **Dose sheet**: steppers for sets, reps *or* seconds (per exercise type), rest-between-sets; buttons **Swap exercise** and **Remove** |
| Swap exercise (in sheet) | Exercise Library in **picker mode**, pre-filtered to same muscle group + user's equipment |
| Add exercise | Exercise Library in picker mode (unfiltered, user's equipment applied) |
| Drag handle | Reorder within session |
| Save | Persist → back to Plan Builder (toast "Saved") |
| Back with unsaved changes | Discard confirm sheet (Keep editing / Discard) |

**States:**
- **Dirty**: Save enabled, header shows subtle "•" edited indicator.
- **Empty** (all exercises removed): inline prompt "No exercises — convert
  to rest day?" [Convert] [Add exercise].
- Loading/error: skeleton rows / inline retry.

**Edge cases:**
- Adding an exercise that conflicts with a stated **limitation**: row gets an
  amber warning badge; adding shows a sheet with the safety note + suggested
  safe alternative [Use alternative] [Add anyway].
- Duration exceeding the user's typical window: soft amber note under the
  duration ("~68 min — longer than your usual 45").
- Editing a **past** day: not possible (view-only summary; history immutable).
- Reps-based vs time-based exercises use the correct control automatically
  (stepper vs seconds picker) — user never chooses the type.

---

## 6. Workout Player ✅ 🚧

**Purpose.** Guided execution of a session — the product's heart. The
committed prototype ([index.html](../index.html)) is the working draft; this
section formalizes it. Full-screen takeover (tab bar hidden), exit via back.

**Layout** (exactly the prototype's architecture):
1. **Sticky header**: plan-name eyebrow, day title (34px), subtitle
   (focus + est. duration). Blur + gradient scrim. Leading **Close (✕)**.
2. **Progress block**: 64px circular ring (done/total) + "Today's session" +
   live status line.
3. **Accordion exercise list** (grouped card). Row: icon chip, name, dose
   meta, check circle, chevron. One row expanded at a time.
4. Expanded row content:
   - **Animation stage**: animated SVG demo + cue caption (STYLE.md §5).
   - **Tracker**: rep stepper (± , set dots, "Set n of m", auto set-rollover)
     *or* timer (numeral + Start/Reset pills) *or* none (simple items like
     walks).
   - **Info blocks**: blue **Form** tip; amber **safety/adaptation** note
     when the user has a relevant limitation (personalized, rule-driven).
   - **Mark Complete** button.
5. Footer note: rest guidance / safety reminder.

**Buttons & destinations:**
| Control | Behavior |
| --- | --- |
| Row header | Expand/collapse (accordion) |
| ± steppers | Rep count; overflow rolls to next set; underflow rolls back |
| Start ‹n›s / Reset | Timer for time-based exercises; completing a run advances the set |
| Mark Complete | Toggles done; ring updates; **auto-writes a log entry** (exercise, sets/reps actually recorded, timestamp) |
| Exercise icon long-press / ⓘ | Exercise Library detail sheet (form deep-dive) without leaving the player |
| Close (✕) | Back to Today; in-progress state persists (local-first, synced) |
| ⋯ on an exercise row (or swipe) | **Remove from today** — edits the exercise out of this session (confirm sheet; logged as removed). Completion requirement recalculates, so the session can still be finished honestly |
| ⋯ overflow (header) | **End workout early** (logs partial session, confirm sheet) / Report a problem with an exercise |

**Completion moment:** when the last non-optional exercise is marked done —
full-screen celebration (ring completes, haptic-feeling burst animation),
session summary (duration, exercises, total reps), any **badges earned** are
revealed one by one, then a single **Done** button → Today (now in completed
state). Activity is published to friends automatically (per privacy setting).

**States:**
- Fresh / in-progress / complete (rows lock into green done state; "Workout
  complete — nice work 💪").
- **Resume**: reopening restores exact state (expanded row, reps, sets).
  State is written locally on every interaction and synced to Supabase in the
  background — the player must be fully functional **offline**.
- Error: sync failures are silent-retried; never block interaction.

**Edge cases:**
- **Optional exercises** (marked in plan, e.g. the prototype's Pallof holds):
  not required for completion; shown with "optional" in the meta.
- Session crossing **midnight**: credited to the calendar day it was
  *started*.
- **End workout early**: partial log saved and visible in history; streak
  credit only on full completion (see §11 — tunable, Appendix A).
- Reduced motion: demos render a static mid-rep pose (STYLE.md contract).
- Screen lock / app switch mid-timer: timer recomputes from wall clock, no
  drift.

---

## 7. Exercise Library ✅ 🚧

**Purpose.** Browse and understand every exercise; the single source of form
guidance. Doubles as the **picker** for the Session Editor. Ships bundled
with the app (fully offline).

**Layout:**
1. Search bar (cancel button appears on focus, iOS-style).
2. **Filter chips** row (horizontally scrollable): muscle group, equipment,
   difficulty, "safe for me" (auto-applies the user's limitations).
3. **List of exercise cards**: thumbnail (static first frame of the SVG demo;
   animates only for the visible/expanded card), name, muscle chips,
   difficulty dots, equipment icon. Amber warning badge if it conflicts with
   the user's limitations.

**Exercise detail** (push, or sheet when opened from the player):
- Full animation stage (looping demo + cue caption).
- Muscle groups, difficulty, equipment.
- **Form** (blue block), **Common mistakes**, **Adaptations** (amber blocks
  keyed to limitation tags — only the relevant ones surface for this user).
- In picker mode: **Add to session** primary button (or **Swap in** when
  swapping).

**Buttons & destinations:**
| Control | Leads to |
| --- | --- |
| Card tap | Exercise detail |
| Add to session / Swap in (picker mode) | Back to Session Editor with the exercise inserted |
| Filter chips | Live-filter the list (animated diff, no reload feel) |

**States:** empty search ("No matches — try a muscle group"), loading (only
on first install hydration), offline = normal.

**Edge cases:**
- Unsafe-for-user exercises are **visible** in the library (education) but
  carry the warning badge and are excluded from generation; picking one in
  picker mode triggers the §5 warning sheet.
- Picker mode always respects the user's equipment setting by default, with
  the filter chip removable ("show all equipment").

---

## 8. Stats & Progress ✅ 🚧

**Purpose.** The payoff screen — proof it's working. Feeds motivation and
retention; everything here derives from auto-logged sessions (zero manual
entry except body weight).

**Layout:**
1. **Streak header**: big flame + current streak, longest streak beside it,
   streak-freeze count (❄️ ×n).
2. **This week** card: sessions done / planned with mini ring.
3. **Consistency chart**: bar chart, sessions per week, last 8 weeks
   (toggle 8w / 6m / all).
4. **Body weight** card (only if user logs weight or has a weight goal):
   line chart with goal line, **＋ Add weigh-in** button.
5. **Totals** row: workouts · minutes · reps (all-time, tabular numerals).
6. **Muscle balance**: horizontal bars of volume per muscle group (last 4
   weeks) — surfaces neglect ("legs 2× your chest volume").
7. **Badges** entry row: earned/total count + chevron → Badges screen (§9).
8. **History**: reverse-chronological list of completed sessions → tap for
   read-only session summary.

**Buttons & destinations:**
| Control | Leads to |
| --- | --- |
| Add weigh-in | Number-pad sheet (unit-aware); saves optimistically |
| Chart period toggles | 8w / 6m / all (animated transition) |
| Badges row | Badges screen |
| History row | Session summary sheet |
| Streak header | Same streak detail sheet as Today |

**States:**
- **New user**: friendly empty state ("Your first workout starts the story")
  with Start CTA → Today. Charts render axes with no data, not blank boxes.
- Loading: skeletons. Weight entries: swipe-to-delete, tap-to-edit.

**Edge cases:** unit toggle re-renders all weights; weeks with zero sessions
show zero-height bars (not gaps); history paginates (infinite scroll).

---

## 9. Badges ✅ 🚧

**Purpose.** The collection. Visible progress toward every badge makes the
next one feel close. Reached from Stats and from Today's teaser.

**Layout:** sectioned grid (3-up): **Streaks · Milestones · Volume · Social ·
Special**. Earned badges: full-color, earn date beneath. Unearned:
silhouette + thin progress bar + short unlock hint ("7-day streak — 4/7").
Secret badges (Special) show "???" until earned.

**Buttons & destinations:**
| Control | Leads to |
| --- | --- |
| Badge tap | Detail sheet: large badge, description, exact progress, earn date (or projected "at this pace: ~Jul 20") |

**States:** never empty (locked badges always render). Multiple simultaneous
unlocks queue their celebrations one by one (in the player's completion
moment, §6).

**Edge cases:** offline-earned badges celebrate on next open (never lost);
progress recomputes server-side on sync — client shows optimistic values.

---

## 10. Profile & Settings ✅ 🚧

**Purpose.** Identity + configuration. Everything editable post-onboarding
lives here so onboarding never needs repeating.

**Layout:**
1. **Header**: avatar, display name, @handle, joined date, mini-stats row
   (streak · badges · workouts).
2. Grouped settings lists (STYLE.md grouped cards):
   - **Account**: Edit profile (name, handle, avatar) · Email · Connected
     accounts (Google).
   - **Body & Goal**: Body stats (age/height/weight) · Units (kg/cm ↔
     lb/ft-in) · Goal (S3 options + target weight).
   - **Training**: Availability (days/weekdays) · Equipment · Limitations.
   - **Notifications**: workout reminder (time picker, per-day) · friend
     activity · badge earned.
   - **Privacy**: activity visibility — **Friends** (default) / **Private**.
   - **About**: version, legal, licenses.
   - **Sign out** · **Delete account** (destructive red).

**Buttons & destinations:**
| Control | Leads to |
| --- | --- |
| Any settings row | Sheet or sub-screen with that form; saves are optimistic with inline confirmation |
| Goal / Availability / Equipment / Limitations save | If the plan is affected: prompt "Regenerate remaining days of this week?" [Regenerate] [Keep] — same banner also appears in Plan Builder |
| Sign out | Confirm sheet |
| Delete account | Double confirmation: sheet + type-your-handle gate; irreversible, deletes data per policy |

**States:** saving = optimistic (instant UI, quiet sync indicator); offline
edits queue and sync.

**Edge cases:**
- Handle change: live uniqueness check, same rules as onboarding.
- Unit change re-renders everywhere instantly (stored values stay metric
  internally — display-only conversion).
- Goal change mid-week: regeneration applies from tomorrow; history kept.

---

## 11. Social / Friends ✅ 🚧

**Purpose.** The accountability engine: friends see your activity, you see
theirs, tiny interactions (fist-bumps) close the loop. **v1 = friends +
activity visibility. Leaderboards are v1.5 — not designed here.**

**Layout:** header + **segmented control**: **Activity | Friends**.

**Activity segment** — feed of cards, newest first:
- Card: avatar, name, event ("completed *Day 3 — Push*"), context line
  (streak "🔥 12", badges earned), relative time.
- Event types in v1: session completed · badge earned · streak milestone
  (7/30/100) · joined RepUp (for new friends).
- **Fist-bump** button per card (the single reaction type in v1): tap →
  bump count increments with a satisfying micro-animation; delivered
  realtime (Supabase Realtime); sender sees "bumped 👊", receiver gets a
  notification.

**Friends segment:**
- **Requests** section (only when non-empty): incoming rows [Accept]
  [Decline]; outgoing rows [Cancel].
- **Friends list**: avatar, name, current streak flame; sorted by most
  recently active.
- **＋ Add friend** (header button): sheet with handle search (live results)
  + **Share invite link** (system share sheet; link deep-links to the app /
  install page).

**Buttons & destinations:**
| Control | Leads to |
| --- | --- |
| Feed card (body) | Friend mini-profile |
| Fist-bump | Realtime reaction (optimistic) |
| Friend row | **Friend mini-profile** sheet: avatar, streak, badge count, weekly consistency ring — only what their privacy allows; **Remove friend** in ⋯ menu (confirm) |
| Add friend | Search + invite sheet |
| Accept / Decline / Cancel | Mutate request (optimistic) |

**States:**
- **No friends**: warm empty state on both segments — "Training is better
  with backup" + [Add friend] + [Share invite link].
- **Friends but quiet feed**: "No activity yet this week" + nudge to bump
  someone.
- Loading skeletons; realtime items animate in from top.
- Offline: feed shows cached items + offline pill; reactions queue.

**Edge cases:**
- Privacy = Private: user's events never enter friends' feeds (existing
  items are not retroactively deleted — knob in Appendix A).
- Deleted accounts render as "RepUp user" in old feed items; friendship rows
  disappear.
- Request spam: max 20 outgoing pending requests; duplicate requests merge.
- Blocking is **v1.5**; v1 offers Remove friend only (removal is silent).
- Fist-bump storms: reactions are idempotent per user per event (one bump,
  tap again to un-bump).

---

## 12. Badges & Motivation — mechanics ✅ 🚧

### 12.1 Streak rules
- A **streak day** = a scheduled workout day whose session was fully
  completed (§6), **or** a scheduled rest day (rest never breaks a streak —
  the plan defines rhythm, not guilt).
- **Full completion is required for streak credit** (owner decision,
  2026-07-08). The escape valve is that the session is editable: a user who
  can't do an exercise removes it from today (§6 "Remove from today") and
  finishes the rest — no partial-credit rules needed.
- Missing a scheduled workout day breaks the streak, **unless** a **streak
  freeze** auto-applies. Freezes: earn 1 per 7 consecutive completed
  sessions, bank max 2, auto-applied silently (user informed next open:
  "❄️ Freeze used — streak safe").
- Day boundary: the user's **device timezone at session start**; timestamps
  stored UTC + tz. Changing timezone can never *break* a streak
  retroactively; ambiguous travel days resolve in the user's favor.
- Streak display: current + longest (Stats §8, Today chip §3).

### 12.2 Badge catalog (v1)

| Badge | Section | Unlock rule |
| --- | --- | --- |
| First Rep | Milestones | Complete first session |
| 10 / 50 / 100 Workouts | Milestones | Total completed sessions |
| Full Week | Milestones | 100% of a week's scheduled sessions |
| Comeback | Milestones | Complete a session after a 7+ day gap |
| Goal Getter | Milestones | Reach target weight (weight goals) |
| 3 / 7 / 30 / 100-Day Streak | Streaks | Streak length (§12.1) |
| 1,000 / 10,000 Reps | Volume | Cumulative logged reps |
| 500 Minutes | Volume | Cumulative session minutes |
| First Ally | Social | First accepted friend |
| Hype Machine | Social | Give 25 fist-bumps |
| Early Bird | Special (secret) | Complete a session started before 7:00 |
| Night Owl | Special (secret) | Complete a session started after 22:00 |
| Perfect Form | Special (secret) | Complete every exercise of a session without reducing any target |

- Rules are **deterministic**, computed server-side on log write (client
  predicts optimistically for instant celebration; server is authoritative).
- Every unlock: celebration in the completion moment (§6), feed event (§11),
  push notification if enabled (§10).

### 12.3 Notifications (motivation surface)
- **Workout reminder**: user-set time on scheduled days; copy references the
  actual session ("Leg day is waiting — 45 min").
- **Streak at risk**: evening of a scheduled, unstarted day (one only).
- **Social**: friend request, fist-bump received, friend earned a big badge
  (batched, never more than 1 social push/day).
- All individually toggleable (§10); default on except social batch.

---

## 13. Theme & Design System ✅

See [STYLE.md](../STYLE.md) — extracted from the reference prototype and
binding for every screen.

---

## Appendix A — product knobs (✅ all confirmed by owner, 2026-07-08)

1. **Streak credit requires full completion** of non-optional exercises
   ("End early" logs history but no streak). **Confirmed** — the session is
   editable, so users edit an exercise out and finish rather than getting
   partial credit (see §6 "Remove from today", §12.1).
2. **Streak freezes**: earn 1 per 7 completed sessions, bank 2, auto-apply.
3. **Privacy switch is not retroactive** (old feed items remain).
4. **Fist-bump is the only reaction** in v1 (one type keeps the feed warm
   and the UI clean).
5. **Rest days count toward streaks** (plan-defined rhythm).
6. **Optional exercises** exist and don't block completion.
7. Outgoing friend-request cap: 20 pending.
8. Badge catalog size (18) — enough to always have a "next one close".
